#ifndef LOCATION_H
#define LOCATION_H

#include <limits>
#include <string>
#include <vector>

class Route;

class Location {
public:
    std::string country;
    std::string capital;
    float lat;
    float lon;
    std::vector<Route*> routes;
    bool exists;
    Location* previous;
    Route* previousRoute;
    float lengthFromStart;

    Location()
        : lat(0.0F), lon(0.0F), exists(true), previous(nullptr),
          previousRoute(nullptr),
          lengthFromStart(std::numeric_limits<float>::infinity()) {}

    Location(const std::string& count, const std::string& cap,
             float lt = 0.0F, float lg = 0.0F)
        : country(count), capital(cap), lat(lt), lon(lg), exists(true),
          previous(nullptr), previousRoute(nullptr),
          lengthFromStart(std::numeric_limits<float>::infinity()) {}

    bool operator==(const Location& rhs) const {
        return capital == rhs.capital;
    }
};

struct compareLocation {
    bool operator()(const Location* lhs, const Location* rhs) const {
        return lhs->lengthFromStart > rhs->lengthFromStart;
    }
};

#endif
