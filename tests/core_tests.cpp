#include <cmath>
#include <cstdio>
#include <fstream>
#include <iostream>
#include <stdexcept>

#include "../data/CsvParser.h"
#include "../routing/Dijkstra.h"

namespace {
const char* locationsFile = "tests/core_locations.csv";
const char* routesFile = "tests/core_routes.csv";

void writeFile(const char* file, const char* text) {
    std::ofstream output(file);
    if (!output) throw std::runtime_error("cannot create fixture");
    output << text;
}

void check(bool condition, const char* message) {
    if (!condition) throw std::runtime_error(message);
}

travel::Graph graphWithRoutes() {
    writeFile(locationsFile, "A,Alpha,0,0\nB,Beta,1,1\nC,Gamma,2,2\nD,Delta,3,3\nF,Zeta,5,5\n");
    writeFile(routesFile,
              "Alpha,Beta,bus,5,300,Direct\n"
              "Alpha,Gamma,train,1,300,First\n"
              "Gamma,Beta,train,1,300,Second\n"
              "Alpha,Delta,plane,10,50,Cheap first\n"
              "Delta,Beta,bus,10,50,Cheap second\n");
    return travel::CsvParser::load(locationsFile, routesFile);
}

void testRoutes() {
    travel::Graph graph = graphWithRoutes();
    travel::PathResult fastest = travel::Dijkstra::find(
        graph, "A", "B", travel::RouteCriterion::Fastest);
    check(fastest.found && fastest.itinerary.segments.size() == 2, "fastest route failed");
    check(std::fabs(fastest.itinerary.totals.duration - 2.0f) < 0.001f,
          "fastest route failed");

    travel::PathResult cheapest = travel::Dijkstra::find(
        graph, "A", "B", travel::RouteCriterion::Cheapest);
    check(cheapest.found && cheapest.itinerary.segments.size() == 2,
          "cheapest route failed");
    check(std::fabs(cheapest.itinerary.totals.cost - 200.0f) < 0.001f,
          "cheapest cost failed");
}

void testMultiStopAndErrors() {
    writeFile(locationsFile, "A,Alpha,0,0\nB,Beta,1,1\nC,Gamma,2,2\n");
    writeFile(routesFile, "Alpha,Gamma,bus,2,20,First\nGamma,Beta,bus,3,30,Second\n");
    travel::Graph graph = travel::CsvParser::load(locationsFile, routesFile);
    travel::PathResult path = travel::Dijkstra::find(
        graph, "A", "B", travel::RouteCriterion::Fastest);
    check(path.found && path.itinerary.segments.size() == 2, "multi-stop route failed");

    check(!travel::Dijkstra::find(graph, "missing", "B",
                                   travel::RouteCriterion::Fastest).found,
          "invalid origin accepted");
    check(!travel::Dijkstra::find(graph, "A", "missing",
                                   travel::RouteCriterion::Fastest).found,
          "invalid destination accepted");
    check(!travel::Dijkstra::find(graph, "A", "A",
                                   travel::RouteCriterion::Fastest).found,
          "same location accepted");
}

void testMalformedAndEmpty() {
    writeFile(locationsFile, "A,Alpha,0,0\nA,Duplicate,1,1\n");
    writeFile(routesFile, "");
    bool threw = false;
    try { travel::CsvParser::load(locationsFile, routesFile); }
    catch (const std::exception&) { threw = true; }
    check(threw, "duplicate row accepted");

    writeFile(locationsFile, "");
    writeFile(routesFile, "");
    travel::Graph empty = travel::CsvParser::load(locationsFile, routesFile);
    check(!travel::Dijkstra::find(empty, "A", "B",
                                   travel::RouteCriterion::Fastest).found,
          "empty input accepted");
}
}

int main() {
    try {
        testRoutes();
        testMultiStopAndErrors();
        testMalformedAndEmpty();
        std::remove(locationsFile);
        std::remove(routesFile);
        std::cout << "All core tests passed.\n";
        return 0;
    } catch (const std::exception& error) {
        std::remove(locationsFile);
        std::remove(routesFile);
        std::cerr << "Core test failure: " << error.what() << '\n';
        return 1;
    }
}
