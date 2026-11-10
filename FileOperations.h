#ifndef FILEOPERATIONS_H
#define FILEOPERATIONS_H

#include <cerrno>
#include <cmath>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <limits>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#include <stack>

#include "Location.h"
#include "Route.h"

inline float parseFloat(const std::string& value, const std::string& field,
                        std::size_t lineNumber) {
    char* end = nullptr;
    errno = 0;
    const char* text = value.c_str();
    const float result = std::strtof(text, &end);

    if (end == text || *end != '\0' || errno == ERANGE ||
        !std::isfinite(result)) {
        throw std::runtime_error("Invalid " + field + " on CSV line " +
                                 std::to_string(lineNumber) + ": " + value);
    }
    return result;
}

inline std::vector<std::string> parseCsvLine(const std::string& line,
                                             std::size_t expectedFields = 0) {
    std::vector<std::string> fields;
    std::string field;
    bool quoted = false;

    for (std::size_t i = 0; i < line.size(); ++i) {
        if (expectedFields > 0 && fields.size() + 1 == expectedFields) {
            field.append(line, i, std::string::npos);
            break;
        }
        const char current = line[i];
        if (current == '"') {
            if (quoted && i + 1 < line.size() && line[i + 1] == '"') {
                field += '"';
                ++i;
            } else {
                quoted = !quoted;
            }
        } else if (current == ',' && !quoted) {
            fields.push_back(field);
            field.clear();
        } else {
            field += current;
        }
    }

    fields.push_back(field);
    for (std::string& value : fields) {
        if (value.size() >= 2 && value.front() == '"' &&
            value.back() == '"') {
            value = value.substr(1, value.size() - 2);
        }
    }
    return fields;
}

inline std::vector<Route*> routeParser(const std::string& filename) {
    std::ifstream input(filename);
    if (!input) {
        throw std::runtime_error("Unable to open routes file: " + filename);
    }

    std::vector<Route*> allRoutes;
    std::string line;
    std::size_t lineNumber = 0;
    while (std::getline(input, line)) {
        ++lineNumber;
        if (line.empty()) {
            continue;
        }

        const std::vector<std::string> fields = parseCsvLine(line, 6);
        if (fields.size() != 6) {
            throw std::runtime_error("Expected 6 route fields on CSV line " +
                                     std::to_string(lineNumber));
        }

        Route* edge = new Route(nullptr, nullptr, fields[2],
                                parseFloat(fields[3], "route time", lineNumber),
                                parseFloat(fields[4], "route cost", lineNumber),
                                fields[5]);
        edge->originS = fields[0];
        edge->destinationS = fields[1];
        allRoutes.push_back(edge);
    }
    return allRoutes;
}

inline std::vector<Location*> locationParser(
    const std::string& filename, const std::vector<Route*>& routes) {
    std::ifstream input(filename);
    if (!input) {
        throw std::runtime_error("Unable to open locations file: " + filename);
    }

    std::vector<Location*> cities;
    std::string line;
    std::size_t lineNumber = 0;
    while (std::getline(input, line)) {
        ++lineNumber;
        if (line.empty()) {
            continue;
        }

        const std::vector<std::string> fields = parseCsvLine(line);
        if (fields.size() != 4) {
            throw std::runtime_error("Expected 4 location fields on CSV line " +
                                     std::to_string(lineNumber));
        }

        Location* node = new Location(
            fields[0], fields[1], parseFloat(fields[2], "latitude", lineNumber),
            parseFloat(fields[3], "longitude", lineNumber));
        cities.push_back(node);
    }

    for (Route* route : routes) {
        for (Location* city : cities) {
            if (route->originS == city->capital) {
                route->origin = city;
                city->routes.push_back(route);
            }
            if (route->destinationS == city->capital) {
                route->destination = city;
            }
        }
        if (route->origin == nullptr || route->destination == nullptr) {
            std::cerr << "Skipping route with unknown location: "
                      << route->originS << " -> " << route->destinationS
                      << '\n';
        }
    }
    return cities;
}

inline void outputGenerator(const std::string& filename,
                            std::stack<Location*> cities,
                            std::stack<Route*> routes, bool) {
    std::ofstream output(filename);
    if (!output) {
        throw std::runtime_error("Unable to create output file: " + filename);
    }

    output << "<!doctype html><html><head><meta charset='utf-8'><title>"
              "Route Planner</title></head><body>"
              "<script src='https://maps.google.com/maps/api/js?sensor=false'>"
              "</script><script>function initialize() {"
              "var map = new google.maps.Map(document.getElementById('map'), "
              "{zoom: 3, center: new google.maps.LatLng(0, 0), "
              "mapTypeId: google.maps.MapTypeId.ROADMAP});";

    int markerCount = 0;
    int routeCount = 0;
    while (cities.size() > 1 && !routes.empty()) {
        Location* origin = cities.top();
        cities.pop();
        Location* destination = cities.top();
        routes.pop();

        output << "var marker" << markerCount
               << " = new google.maps.Marker({position: new google.maps.LatLng("
               << origin->lat << ", " << origin->lon
               << "), map: map, title: '" << origin->capital << ", "
               << origin->country << "'});";
        ++markerCount;
        output << "var marker" << markerCount
               << " = new google.maps.Marker({position: new google.maps.LatLng("
               << destination->lat << ", " << destination->lon
               << "), map: map, title: '" << destination->capital << ", "
               << destination->country << "'});";
        ++markerCount;
        output << "var path" << routeCount
               << " = new google.maps.Polyline({path: [new google.maps.LatLng("
               << origin->lat << ", " << origin->lon
               << "), new google.maps.LatLng(" << destination->lat << ", "
               << destination->lon
               << ")], strokeColor: '#0000FF', strokeOpacity: 1.0, "
                  "strokeWeight: 2}); path"
               << routeCount << ".setMap(map);";
        ++routeCount;
    }
    output << "} google.maps.event.addDomListener(window, 'load', initialize);"
              "</script><div id='map' style='width:100%;height:100vh;'></div>"
              "</body></html>";
}

#endif
