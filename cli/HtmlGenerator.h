#ifndef TRAVEL_CLI_HTML_GENERATOR_H
#define TRAVEL_CLI_HTML_GENERATOR_H

#include <fstream>
#include <iomanip>
#include <stdexcept>
#include <string>

#include "../domain/PathResult.h"

namespace travel {

inline std::string javascriptString(const std::string& value) {
    std::string escaped;
    for (char character : value) {
        if (character == '\\' || character == '"') escaped += '\\';
        if (character == '\n' || character == '\r') {
            escaped += ' ';
        } else {
            escaped += character;
        }
    }
    return escaped;
}

inline void writeHtml(const std::string& filename, const PathResult& path) {
    std::ofstream output(filename);
    if (!output) throw std::runtime_error("Unable to create output file: " + filename);
    output << "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
              "<title>Route Planner</title>"
              "<script src=\"https://maps.google.com/maps/api/js?sensor=false\"></script>"
              "</head><body><div id=\"map\" style=\"width:100%;height:100vh\"></div>"
              "<script>function initialize(){"
              "var map=new google.maps.Map(document.getElementById('map'),"
              "{zoom:3,center:new google.maps.LatLng(0,0),"
              "mapTypeId:google.maps.MapTypeId.ROADMAP});";

    for (std::size_t i = 0; i < path.locations.size(); ++i) {
        const Location& location = *path.locations[i];
        output << "new google.maps.Marker({position:new google.maps.LatLng("
               << std::setprecision(8) << location.latitude << "," << location.longitude
               << "),map:map,title:\"" << javascriptString(location.capital) << ", "
               << javascriptString(location.country) << "\"});";
        if (i + 1 < path.locations.size()) {
            const Route& route = *path.routes[i];
            const Location& next = *path.locations[i + 1];
            output << "var path" << i << "=new google.maps.Polyline({path:["
                   << "new google.maps.LatLng(" << location.latitude << ","
                   << location.longitude << "),new google.maps.LatLng("
                   << next.latitude << "," << next.longitude
                   << ")],strokeColor:'#0000FF',strokeOpacity:1.0,strokeWeight:2});"
                   << "path" << i << ".setMap(map);";
            output << "google.maps.event.addListener(path" << i
                   << ",'click',function(){alert(\""
                   << javascriptString(location.country) << " to "
                   << javascriptString(next.country) << " ("
                   << javascriptString(route.transport) << ", "
                   << route.time << " hours, $" << route.cost << ")\");});";
        }
    }
    output << "}google.maps.event.addDomListener(window,'load',initialize);"
              "</script></body></html>";
}

}  // namespace travel

#endif
