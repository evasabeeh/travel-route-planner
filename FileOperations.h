#ifndef FILEOPERATIONS_H
#define FILEOPERATIONS_H

#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <stack>
#include <stdexcept>
#include <string>
#include <vector>

#include "Location.h"

inline std::vector<std::string> parseCsvLine(const std::string& line) {
    std::vector<std::string> fields;
    std::string field;
    bool quoted = false;
    for (std::size_t i = 0; i < line.size(); ++i) {
        const char ch = line[i];
        if (ch == '"') {
            if (quoted && i + 1 < line.size() && line[i + 1] == '"') {
                field += '"';
                ++i;
            } else {
                quoted = !quoted;
            }
        } else if (ch == ',' && !quoted) {
            fields.push_back(field);
            field.clear();
        } else {
            field += ch;
        }
    }
    if (quoted) {
        throw std::runtime_error("unterminated quoted field");
    }
    fields.push_back(field);
    return fields;
}

inline float parseNumber(const std::string& value, const std::string& field,
                         std::size_t lineNumber, const std::string& filename) {
    try {
        std::size_t consumed = 0;
        const float result = std::stof(value, &consumed);
        if (consumed != value.size()) {
            throw std::invalid_argument("trailing characters");
        }
        return result;
    } catch (const std::exception&) {
        throw std::runtime_error(filename + ":" + std::to_string(lineNumber) +
                                 ": invalid " + field + " value '" + value + "'");
    }
}

inline std::vector<std::unique_ptr<Route>> routeParser(const std::string& filename) {
    std::ifstream input(filename);
    if (!input) {
        throw std::runtime_error("Unable to open routes file: " + filename);
    }

    std::vector<std::unique_ptr<Route>> routes;
    std::string line;
    std::size_t lineNumber = 0;
    while (std::getline(input, line)) {
        ++lineNumber;
        if (line.empty()) continue;
        const std::vector<std::string> fields = parseCsvLine(line);
        if (fields.size() < 6 || fields[0].empty() || fields[1].empty() ||
            fields[2].empty()) {
            throw std::runtime_error(filename + ":" + std::to_string(lineNumber) +
                                     ": expected 6 route fields");
        }
        const float time = parseNumber(fields[3], "time", lineNumber, filename);
        const float cost = parseNumber(fields[4], "cost", lineNumber, filename);
        if (time < 0.0f || cost < 0.0f) {
            throw std::runtime_error(filename + ":" + std::to_string(lineNumber) +
                                     ": route values cannot be negative");
        }
        std::string note = fields[5];
        for (std::size_t i = 6; i < fields.size(); ++i) note += "," + fields[i];
        std::unique_ptr<Route> route(new Route(nullptr, nullptr, fields[2], time,
                                                cost, note));
        route->originS = fields[0];
        route->destinationS = fields[1];
        routes.push_back(std::move(route));
    }
    return routes;
}

inline std::vector<std::unique_ptr<Location>> locationParser(
    const std::string& filename, std::vector<std::unique_ptr<Route>>& routes) {
    std::ifstream input(filename);
    if (!input) {
        throw std::runtime_error("Unable to open locations file: " + filename);
    }

    std::vector<std::unique_ptr<Location>> cities;
    std::string line;
    std::size_t lineNumber = 0;
    while (std::getline(input, line)) {
        ++lineNumber;
        if (line.empty()) continue;
        const std::vector<std::string> fields = parseCsvLine(line);
        if (fields.size() != 4 || fields[0].empty()) {
            throw std::runtime_error(filename + ":" + std::to_string(lineNumber) +
                                     ": expected 4 location fields");
        }
        const float latitude = parseNumber(fields[2], "latitude", lineNumber, filename);
        const float longitude = parseNumber(fields[3], "longitude", lineNumber, filename);
        cities.emplace_back(new Location(fields[0], fields[1], latitude, longitude));
    }

    for (std::unique_ptr<Route>& route : routes) {
        Location* origin = nullptr;
        Location* destination = nullptr;
        for (const std::unique_ptr<Location>& city : cities) {
            if (city->capital == route->originS) origin = city.get();
            if (city->capital == route->destinationS) destination = city.get();
        }
        if (origin == nullptr || destination == nullptr) {
            throw std::runtime_error("Route references unknown city: " +
                                     route->originS + " -> " + route->destinationS);
        }
        route->origin = origin;
        route->destination = destination;
        origin->routes.push_back(route.get());
    }
    return cities;
}

inline void outputGenerator(const std::string& filename, std::stack<Location*> cities,
                            std::stack<Route*> routes, bool costOrTime) {
    std::ofstream output(filename);
    if (!output) throw std::runtime_error("Unable to create output file: " + filename);
    output << "<HTML><HEAD><TITLE>Route Planner</TITLE></HEAD><script "
              "src='http://maps.google.com/maps/api/js?sensor=false'></script><script>"
              "function initialize(){var map=new google.maps.Map(document.getElementById('map'),"
              "{zoom:3,center:new google.maps.LatLng(0,0),mapTypeId:google.maps.MapTypeId.ROADMAP});";
    int markerCount = 0;
    int contentCount = 0;
    while (!cities.empty() && cities.size() > 1 && !routes.empty()) {
        Location* origin = cities.top();
        cities.pop();
        Location* destination = cities.top();
        Route* route = routes.top();
        routes.pop();
        float displayedCost = route->cost;
        if (route->transport == "plane") displayedCost /= MULTI;
        output << "new google.maps.Marker({position:new google.maps.LatLng("
               << origin->lat << "," << origin->lon << "),map:map,title:\""
               << origin->capital << ", " << origin->country << "\"});";
        output << "new google.maps.Marker({position:new google.maps.LatLng("
               << destination->lat << "," << destination->lon << "),map:map,title:\""
               << destination->capital << ", " << destination->country << "\"});";
        output << "var path" << contentCount << "=new google.maps.Polyline({path:[new google.maps.LatLng("
               << origin->lat << "," << origin->lon << "),new google.maps.LatLng("
               << destination->lat << "," << destination->lon << ")],strokeColor:'#0000FF',"
                  "strokeOpacity:1.0,strokeWeight:2});path" << contentCount
               << ".setMap(map);";
        ++markerCount;
        ++contentCount;
    }
    (void)markerCount;
    (void)costOrTime;
    output << "}google.maps.event.addDomListener(window,'load',initialize);</script>"
              "</HEAD><BODY><div id='map' style='width:100%;height:100%;'></div></BODY></HTML>";
}

#endif
