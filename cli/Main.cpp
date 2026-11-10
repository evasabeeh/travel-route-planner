#include <iostream>
#include <string>

#include "HtmlGenerator.h"
#include "../data/CsvParser.h"
#include "../routing/Dijkstra.h"

int main(int argc, char* argv[]) {
    std::string output;
    std::string origin;
    std::string destination;
    std::string preference;
    if (argc == 1) {
        std::cout << "Output filename (.html): ";
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
        std::cerr << "Usage: travel <output.html> <origin-country> "
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
        travel::writeHtml(output, path);
        std::cout << "Output file generated: " << output << '\n';
    } catch (const std::exception& error) {
        std::cerr << "Error: " << error.what() << '\n';
        return 1;
    }
    return 0;
}
