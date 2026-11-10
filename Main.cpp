#include <iostream>
#include <stack>
#include <stdexcept>
#include <string>

#include "FileOperations.h"
#include "GraphFunctions.h"

int main(int argc, char* argv[]) {
    std::string outputFilename;
    std::string origin;
    std::string destination;
    std::string preference;

    if (argc == 1) {
        std::cout << "Output filename (.html): ";
        if (!(std::cin >> outputFilename)) return 2;
        std::cout << "Origin country: ";
        if (!(std::cin >> origin)) return 2;
        std::cout << "Destination country: ";
        if (!(std::cin >> destination)) return 2;
        std::cout << "Preference (fastest/cheapest): ";
        if (!(std::cin >> preference)) return 2;
    } else if (argc == 5) {
        outputFilename = argv[1];
        origin = argv[2];
        destination = argv[3];
        preference = argv[4];
    } else {
        std::cerr << "Usage: travel <output.html> <origin-country> "
                     "<destination-country> <fastest|cheapest>\n";
        return 2;
    }

    bool cheapest = false;
    if (preference == "cheapest") {
        cheapest = true;
    } else if (preference != "fastest") {
        std::cerr << "Preference must be 'fastest' or 'cheapest'.\n";
        return 2;
    }

    try {
        Graph graph("locations.csv", "routes.csv");
        if (graph.getCity(origin) == nullptr) {
            std::cerr << "Origin country not found: " << origin << '\n';
            return 1;
        }
        if (graph.getCity(destination) == nullptr) {
            std::cerr << "Destination country not found: " << destination << '\n';
            return 1;
        }
        if (origin == destination) {
            std::cerr << "Origin and destination must be different.\n";
            return 1;
        }
        if (!graph.Dijkstras(origin, cheapest) || !graph.hasRoute(destination)) {
            std::cerr << "No route found from " << origin << " to "
                      << destination << ".\n";
            return 1;
        }
        std::stack<Location*> cityStack = graph.cityStacker(destination);
        std::stack<Route*> routeStack = graph.routeStacker(destination);
        outputGenerator(outputFilename, cityStack, routeStack, cheapest);
        std::cout << "Output file generated: " << outputFilename << '\n';
    } catch (const std::exception& error) {
        std::cerr << "Error: " << error.what() << '\n';
        return 1;
    }
    return 0;
}
