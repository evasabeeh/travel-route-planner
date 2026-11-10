#ifndef GRAPHFUNCTIONS_H
#define GRAPHFUNCTIONS_H

#include <cmath>
#include <limits>
#include <queue>
#include <stack>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include "FileOperations.h"

class Graph {
public:
    std::vector<Route*> routes;
    std::vector<Location*> cities;
    int numExists;

    Graph(const std::string& nodesFile, const std::string& edgesFile)
        : routes(routeParser(edgesFile)),
          cities(locationParser(nodesFile, routes)),
          numExists(static_cast<int>(cities.size())) {}

    ~Graph() {
        for (Route* route : routes) {
            delete route;
        }
        for (Location* city : cities) {
            delete city;
        }
    }

    Graph(const Graph&) = delete;
    Graph& operator=(const Graph&) = delete;

    int getCityIndex(const std::string& key) const {
        for (std::size_t i = 0; i < cities.size(); ++i) {
            if (cities[i]->country == key) {
                return static_cast<int>(i);
            }
        }
        return -1;
    }

    Location* getCity(const std::string& key) const {
        const int index = getCityIndex(key);
        return index == -1 ? nullptr : cities[static_cast<std::size_t>(index)];
    }

    float getWeight(const std::string& startS, const std::string& endS,
                    bool costOrTime) const {
        return getWeight(getCity(startS), getCity(endS), costOrTime);
    }

    float getWeight(const Location* start, const Location* end,
                    bool costOrTime) const {
        if (start == nullptr || end == nullptr) {
            return -1.0F;
        }
        for (const Route* route : routes) {
            if (route->doesConnect(start, end)) {
                return costOrTime ? route->cost : route->time;
            }
        }
        return -1.0F;
    }

    bool Dijkstras(const std::string& startS, bool costOrTime) {
        Location* start = getCity(startS);
        if (start == nullptr) {
            return false;
        }

        const float infinity = std::numeric_limits<float>::infinity();
        for (Location* city : cities) {
            city->lengthFromStart = infinity;
            city->previous = nullptr;
            city->previousRoute = nullptr;
            city->exists = true;
        }

        using QueueEntry = std::pair<float, Location*>;
        std::priority_queue<QueueEntry, std::vector<QueueEntry>,
                            std::greater<QueueEntry>> minHeap;
        start->lengthFromStart = 0.0F;
        minHeap.push({0.0F, start});

        while (!minHeap.empty()) {
            const QueueEntry current = minHeap.top();
            minHeap.pop();
            Location* city = current.second;

            if (current.first > city->lengthFromStart) {
                continue;
            }
            if (!city->exists) {
                continue;
            }
            city->exists = false;

            for (Route* route : city->routes) {
                if (route->destination == nullptr) {
                    continue;
                }

                Location* adjacent = route->destination;
                const float weight = costOrTime ? route->cost : route->time;
                const float distance = city->lengthFromStart + weight;
                if (distance < adjacent->lengthFromStart) {
                    adjacent->lengthFromStart = distance;
                    adjacent->previous = city;
                    adjacent->previousRoute = route;
                    adjacent->exists = true;
                    minHeap.push({distance, adjacent});
                }
            }
        }
        return true;
    }

    std::vector<Location*> adjacentLocations(Location* city) const {
        std::vector<Location*> output;
        if (city == nullptr) {
            return output;
        }
        for (const Route* route : city->routes) {
            if (route->destination != nullptr) {
                output.push_back(route->destination);
            }
        }
        return output;
    }

    std::vector<Route*> adjacentRoutes(Location* city) const {
        std::vector<Route*> output;
        if (city == nullptr) {
            return output;
        }
        for (Route* route : routes) {
            if (route->origin == city && route->destination != nullptr) {
                output.push_back(route);
            }
        }
        return output;
    }

    Route* getRoute(Location* start, bool costOrTime,
                    float totalDistance) const {
        if (start == nullptr) {
            return nullptr;
        }
        for (Route* route : start->routes) {
            if (route->destination == nullptr) {
                continue;
            }
            const float weight = costOrTime ? route->cost : route->time;
            const float expected = start->lengthFromStart + weight;
            if (std::fabs(expected - totalDistance) < 1e-5F) {
                return route;
            }
        }
        return nullptr;
    }

    std::stack<Location*> cityStacker(const std::string& destinationS) const {
        std::stack<Location*> output;
        Location* destination = getCity(destinationS);
        if (destination == nullptr ||
            std::isinf(destination->lengthFromStart)) {
            return output;
        }

        while (destination != nullptr) {
            output.push(destination);
            destination = destination->previous;
        }
        return output;
    }

    std::stack<Route*> routeStacker(const std::string& destinationS,
                                    bool) const {
        std::stack<Route*> output;
        Location* destination = getCity(destinationS);
        if (destination == nullptr ||
            std::isinf(destination->lengthFromStart)) {
            return output;
        }

        while (destination->previous != nullptr) {
            if (destination->previousRoute == nullptr) {
                output = std::stack<Route*>();
                return output;
            }
            output.push(destination->previousRoute);
            destination = destination->previous;
        }
        return output;
    }
};

#endif
