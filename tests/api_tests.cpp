#include <cstdio>
#include <fstream>
#include <iostream>
#include <stdexcept>

#include "../api/ApiService.h"

namespace {
const char* locationsFile = "tests/api_locations.csv";
const char* routesFile = "tests/api_routes.csv";

void writeFile(const char* file, const char* text) {
    std::ofstream output(file);
    if (!output) throw std::runtime_error("cannot create API fixture");
    output << text;
}

void check(bool condition, const char* message) {
    if (!condition) throw std::runtime_error(message);
}
}

int main() {
    try {
        writeFile(locationsFile, "A,Alpha,0,0\nB,Beta,1,1\nC,Gamma,2,2\n");
        writeFile(routesFile,
                  "Alpha,Beta,bus,5,100,Direct\n"
                  "Alpha,Gamma,train,1,20,First\n"
                  "Gamma,Beta,train,1,20,Second\n");
        travel::Graph graph = travel::CsvParser::load(locationsFile, routesFile);
        travel::ApiService api(graph);

        travel::ApiResponse locations = api.handle({"GET", "/locations", ""});
        check(locations.status == 200 && locations.body.find("\"Alpha\"") != std::string::npos,
              "locations endpoint failed");

        travel::ApiResponse search = api.handle(
            {"POST", "/routes/search",
             "{\"origin\":\"A\",\"destination\":\"B\",\"preference\":\"fastest\"}"});
        check(search.status == 200 && search.body.find("\"segments\"") != std::string::npos,
              "route search endpoint failed");

        travel::ApiResponse filtered = api.handle(
            {"POST", "/routes/search",
             "{\"origin\":\"A\",\"destination\":\"B\",\"transportTypes\":[\"bus\"],"
             "\"maximumTransfers\":0}"});
        check(filtered.status == 200 && filtered.body.find("\"transfers\":0") != std::string::npos,
              "route filters failed");

        travel::ApiResponse transferLimited = api.handle(
            {"POST", "/routes/search",
             "{\"origin\":\"A\",\"destination\":\"B\",\"transportTypes\":[\"train\"],"
             "\"maximumTransfers\":0}"});
        check(transferLimited.status == 404 &&
                  transferLimited.body.find("NO_ROUTE") != std::string::npos,
              "maximum transfer validation failed");

        travel::ApiResponse invalid = api.handle(
            {"POST", "/routes/search", "{\"origin\":\"missing\",\"destination\":\"B\"}"});
        check(invalid.status == 400 && invalid.body.find("INVALID_ORIGIN") != std::string::npos,
              "validation error failed");

        travel::ApiResponse route = api.handle({"GET", "/routes/0", ""});
        check(route.status == 200 && route.body.find("\"transport\":\"bus\"") != std::string::npos,
              "route detail endpoint failed");

        travel::ApiResponse missing = api.handle({"GET", "/routes/99", ""});
        check(missing.status == 404, "missing route response failed");

        std::remove(locationsFile);
        std::remove(routesFile);
        std::cout << "All API tests passed.\n";
        return 0;
    } catch (const std::exception& error) {
        std::remove(locationsFile);
        std::remove(routesFile);
        std::cerr << "API test failure: " << error.what() << '\n';
        return 1;
    }
}
