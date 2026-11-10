#ifndef GRAPHFUNCTIONS_H
#define GRAPHFUNCTIONS_H

#include <cmath>
#include <limits>
#include <memory>
#include <queue>
#include <stack>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include "FileOperations.h"

class Graph {
public:
    std::vector<Location*> cities;
    std::vector<Route*> routes;

    Graph(const std::string& nodesFile, const std::string& edgesFile) {
        ownedRoutes = routeParser(edgesFile);
        ownedCities = locationParser(nodesFile, ownedRoutes);
        for (const std::unique_ptr<Location>& city : ownedCities) cities.push_back(city.get());
        for (const std::unique_ptr<Route>& route : ownedRoutes) routes.push_back(route.get());
    }

    int getCityIndex(const std::string& key) const {
        for (std::size_t i = 0; i < cities.size(); ++i) {
            if (cities[i]->country == key) return static_cast<int>(i);
        }
        return -1;
    }

    Location* getCity(const std::string& key) const {
        const int index = getCityIndex(key);
        return index < 0 ? nullptr : cities[static_cast<std::size_t>(index)];
    }

    float getWeight(Location* start, Location* end, bool costOrTime) const {
        for (Route* route : start->routes) {
            if (route->destination == end) return costOrTime ? route->cost : route->time;
        }
        return std::numeric_limits<float>::infinity();
    }

    bool Dijkstras(const std::string& startS, bool costOrTime) {
        Location* start = getCity(startS);
        if (start == nullptr) return false;
        for (Location* city : cities) {
            city->lengthFromStart = std::numeric_limits<float>::infinity();
            city->previous = nullptr;
            city->previousRoute = nullptr;
        }
        typedef std::pair<float, Location*> QueueEntry;
        std::priority_queue<QueueEntry, std::vector<QueueEntry>,
                            std::greater<QueueEntry>> queue;
        start->lengthFromStart = 0.0f;
        queue.push(std::make_pair(0.0f, start));
        while (!queue.empty()) {
            const QueueEntry current = queue.top();
            queue.pop();
            Location* city = current.second;
            if (current.first > city->lengthFromStart) continue;
            for (Route* route : city->routes) {
                Location* adjacent = route->destination;
                const float weight = costOrTime ? route->cost : route->time;
                const float distance = city->lengthFromStart + weight;
                if (distance < adjacent->lengthFromStart) {
                    adjacent->lengthFromStart = distance;
                    adjacent->previous = city;
                    adjacent->previousRoute = route;
                    queue.push(std::make_pair(distance, adjacent));
                }
            }
        }
        return true;
    }

    bool hasRoute(const std::string& destinationS) const {
        Location* destination = getCity(destinationS);
        return destination != nullptr &&
               std::isfinite(destination->lengthFromStart);
    }

    std::stack<Location*> cityStacker(const std::string& destinationS) const {
        std::stack<Location*> result;
        Location* destination = getCity(destinationS);
        while (destination != nullptr) {
            result.push(destination);
            destination = destination->previous;
        }
        return result;
    }

    std::stack<Route*> routeStacker(const std::string& destinationS) const {
        std::stack<Route*> result;
        Location* destination = getCity(destinationS);
        while (destination != nullptr && destination->previous != nullptr) {
            if (destination->previousRoute == nullptr) {
                throw std::runtime_error("Route reconstruction failed");
            }
            result.push(destination->previousRoute);
            destination = destination->previous;
        }
        return result;
    }

private:
    std::vector<std::unique_ptr<Location>> ownedCities;
    std::vector<std::unique_ptr<Route>> ownedRoutes;
};

#endif
