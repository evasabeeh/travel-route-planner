// // This program is designed to parse city and route data from files, build a graph from that data, and then find the shortest or cheapest path between two specified cities using Dijkstra's algorithm. It outputs the results to an HTML file.

#include <iostream>
#include <string>
#include <stack>
#include <stdexcept>

#include "FileOperations.h"          // custom header
#include "Route.h"
#include "GraphFunctions.h"

int main(int argc, char* argv[]){
    std::string outputFilename;
    std::string origin;
    std::string destination;
    std::string preference;

    if (argc == 1) {
        std::cout << "Enter filename for output (.html): ";
        std::cin >> outputFilename;
        std::cout << "Origin country: ";
        std::cin >> origin;
        std::cout << "Destination country: ";
        std::cin >> destination;
        std::cout << "Enter a preference (fastest/cheapest): ";
        std::cin >> preference;
    } else if (argc == 5) {
        outputFilename = argv[1];
        origin = argv[2];
        destination = argv[3];
        preference = argv[4];
    } else {
        std::cerr << "Usage: Main.exe <output.html> <origin-country> "
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
            std::cerr << "Destination country not found: " << destination
                      << '\n';
            return 1;
        }
        if (!graph.Dijkstras(origin, cheapest)) {
            std::cerr << "Unable to calculate a route from " << origin
                      << ".\n";
            return 1;
        }

        std::stack<Location*> cityStack = graph.cityStacker(destination);
        std::stack<Route*> routeStack = graph.routeStacker(destination, cheapest);
        if (cityStack.empty() || routeStack.empty()) {
            if (origin == destination) {
                std::cerr << "Origin and destination must be different.\n";
            } else {
                std::cerr << "No route found from " << origin << " to "
                          << destination << ".\n";
            }
            return 1;
        }

        outputGenerator(outputFilename, cityStack, routeStack, cheapest);
        std::cout << "Output file generated: " << outputFilename << '\n';
    } catch (const std::exception& error) {
        std::cerr << "Error: " << error.what() << '\n';
        return 1;
    }
    return 0;
}
