#include <iostream>
#include <fstream>
#include <iomanip>
#include <string>

#include "../data/CsvParser.h"
#include "../routing/Dijkstra.h"

namespace {
std::string jsonString(const std::string& value) {
    std::string escaped;
    for (const char character : value) {
        if (character == '\\' || character == '"') escaped += '\\';
        escaped += character == '\n' || character == '\r' ? ' ' : character;
    }
    return escaped;
}

void writeRouteJson(const std::string& filename, const travel::Itinerary& itinerary) {
    std::ofstream output(filename);
    if (!output) throw std::runtime_error("Unable to create output file: " + filename);
    output << std::setprecision(8)
           << "{\"origin\":\"" << jsonString(itinerary.origin)
           << "\",\"destination\":\"" << jsonString(itinerary.destination)
           << "\",\"totalCost\":" << itinerary.totals.cost
           << ",\"totalDuration\":" << itinerary.totals.duration
           << ",\"transfers\":" << itinerary.transfers << ",\"segments\":[";
    for (std::size_t index = 0; index < itinerary.segments.size(); ++index) {
        const travel::RouteSegment& segment = itinerary.segments[index];
        if (index != 0) output << ',';
        output << "{\"origin\":{\"country\":\"" << jsonString(segment.origin.country)
               << "\",\"capital\":\"" << jsonString(segment.origin.capital)
               << "\",\"latitude\":" << segment.origin.latitude
               << ",\"longitude\":" << segment.origin.longitude
               << "},\"destination\":{\"country\":\"" << jsonString(segment.destination.country)
               << "\",\"capital\":\"" << jsonString(segment.destination.capital)
               << "\",\"latitude\":" << segment.destination.latitude
               << ",\"longitude\":" << segment.destination.longitude
               << "},\"transport\":\"" << travel::transportTypeName(segment.transport)
               << "\",\"cost\":" << segment.metrics.cost
               << ",\"duration\":" << segment.metrics.duration << '}';
    }
    output << "]}";
}
}

int main(int argc, char* argv[]) {
    std::string output;
    std::string origin;
    std::string destination;
    std::string preference;
    if (argc == 1) {
        std::cout << "Output filename (.json): ";
        if (!(std::cin >> output)) return 2;
        std::cout << "Origin country: ";
        if (!(std::cin >> origin)) return 2;
        std::cout << "Destination country: ";
        if (!(std::cin >> destination)) return 2;
        std::cout << "Preference (fastest/cheapest): ";
        if (!(std::cin >> preference)) return 2;
    } else if (argc == 5) {
        output = argv[1];
        origin = argv[2];
        destination = argv[3];
        preference = argv[4];
    } else {
        std::cerr << "Usage: travel <output.json> <origin-country> "
                     "<destination-country> <fastest|cheapest>\n";
        return 2;
    }

    travel::RouteCriterion criterion;
    if (preference == "fastest") {
        criterion = travel::RouteCriterion::Fastest;
    } else if (preference == "cheapest") {
        criterion = travel::RouteCriterion::Cheapest;
    } else {
        std::cerr << "Preference must be 'fastest' or 'cheapest'.\n";
        return 2;
    }

    try {
        const travel::Graph graph = travel::CsvParser::load("locations.csv", "routes.csv");
        const travel::PathResult path =
            travel::Dijkstra::find(graph, origin, destination, criterion);
        if (!path.found) {
            std::cerr << path.error.code << ": " << path.error.message << '\n';
            return 1;
        }
        writeRouteJson(output, path.itinerary);
        std::cout << "Route JSON generated: " << output << '\n';
    } catch (const std::exception& error) {
        std::cerr << "Error: " << error.what() << '\n';
        return 1;
    }
    return 0;
}
