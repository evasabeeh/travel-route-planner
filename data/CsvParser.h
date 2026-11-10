#ifndef TRAVEL_DATA_CSV_PARSER_H
#define TRAVEL_DATA_CSV_PARSER_H

#include <fstream>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

#include "../routing/Graph.h"

namespace travel {

class CsvParser {
public:
    static Graph load(const std::string& locationsFile, const std::string& routesFile) {
        Graph graph;
        loadLocations(locationsFile, graph);
        loadRoutes(routesFile, graph);
        return graph;
    }

private:
    static std::vector<std::string> fields(const std::string& line) {
        std::vector<std::string> result;
        std::string field;
        bool quoted = false;
        for (std::size_t i = 0; i < line.size(); ++i) {
            if (line[i] == '"' && quoted && i + 1 < line.size() && line[i + 1] == '"') {
                field += '"';
                ++i;
            } else if (line[i] == '"') {
                quoted = !quoted;
            } else if (line[i] == ',' && !quoted) {
                result.push_back(field);
                field.clear();
            } else {
                field += line[i];
            }
        }
        if (quoted) throw std::runtime_error("unterminated quoted CSV field");
        result.push_back(field);
        return result;
    }

    static float number(const std::string& value, const std::string& name,
                        std::size_t line, const std::string& file,
                        bool nonNegative) {
        try {
            std::size_t consumed = 0;
            float parsed = std::stof(value, &consumed);
            if (consumed != value.size() || (nonNegative && parsed < 0.0f)) {
                throw std::invalid_argument("invalid");
            }
            return parsed;
        } catch (const std::exception&) {
            throw std::runtime_error(file + ":" + std::to_string(line) +
                                     ": invalid " + name + " value '" + value + "'");
        }
    }

    static void loadLocations(const std::string& file, Graph& graph) {
        std::ifstream input(file);
        if (!input) throw std::runtime_error("Unable to open locations file: " + file);
        std::string line;
        std::size_t lineNumber = 0;
        while (std::getline(input, line)) {
            ++lineNumber;
            if (line.empty()) continue;
            const std::vector<std::string> row = fields(line);
            if (row.size() != 4 || row[0].empty()) {
                throw std::runtime_error(file + ":" + std::to_string(lineNumber) +
                                         ": expected 4 location fields");
            }
            if (graph.findByCountry(row[0]) != nullptr) {
                throw std::runtime_error(file + ":" + std::to_string(lineNumber) +
                                         ": duplicate location '" + row[0] + "'");
            }
            graph.addLocation(row[0], row[1], number(row[2], "latitude", lineNumber, file, false),
                              number(row[3], "longitude", lineNumber, file, false));
        }
    }

    static void loadRoutes(const std::string& file, Graph& graph) {
        std::ifstream input(file);
        if (!input) throw std::runtime_error("Unable to open routes file: " + file);
        std::string line;
        std::size_t lineNumber = 0;
        while (std::getline(input, line)) {
            ++lineNumber;
            if (line.empty()) continue;
            const std::vector<std::string> row = fields(line);
            if (row.size() < 6 || row[0].empty() || row[1].empty() || row[2].empty()) {
                throw std::runtime_error(file + ":" + std::to_string(lineNumber) +
                                         ": expected 6 route fields");
            }
            std::string note = row[5];
            for (std::size_t i = 6; i < row.size(); ++i) note += "," + row[i];
            const float time = number(row[3], "time", lineNumber, file, true);
            const float cost = number(row[4], "cost", lineNumber, file, true);
            graph.addRoute(row[0], row[1], transportTypeFromString(row[2]), time,
                           row[2] == "plane" ? cost * PLANE_COST_MULTIPLIER : cost, note);
        }
    }
};

}  // namespace travel

#endif
