#ifndef TRAVEL_ROUTING_GRAPH_H
#define TRAVEL_ROUTING_GRAPH_H

#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

#include "../domain/Location.h"
#include "../domain/Route.h"

namespace travel {

class Graph {
public:
    const Location* addLocation(const std::string& country, const std::string& capital,
                                float latitude, float longitude) {
        locations_.push_back(std::unique_ptr<Location>(
            new Location{country, capital, latitude, longitude}));
        return locations_.back().get();
    }

    void addRoute(const std::string& originCity, const std::string& destinationCity,
                  const std::string& transport, float time, float cost,
                  const std::string& note) {
        const Location* origin = findByCapital(originCity);
        const Location* destination = findByCapital(destinationCity);
        if (origin == nullptr || destination == nullptr) {
            throw std::runtime_error("Route references unknown city: " +
                                     originCity + " -> " + destinationCity);
        }
        routes_.push_back(std::unique_ptr<Route>(new Route{
            origin, destination, transport, time, cost, note}));
    }

    const Location* findByCountry(const std::string& country) const {
        for (const std::unique_ptr<Location>& location : locations_) {
            if (location->country == country) return location.get();
        }
        return nullptr;
    }

    const Location* findByCapital(const std::string& capital) const {
        for (const std::unique_ptr<Location>& location : locations_) {
            if (location->capital == capital) return location.get();
        }
        return nullptr;
    }

    const std::vector<std::unique_ptr<Location>>& locations() const { return locations_; }
    const std::vector<std::unique_ptr<Route>>& routes() const { return routes_; }

private:
    std::vector<std::unique_ptr<Location>> locations_;
    std::vector<std::unique_ptr<Route>> routes_;
};

}  // namespace travel

#endif
