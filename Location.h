#ifndef LOCATION_H
#define LOCATION_H

#include <limits>
#include <string>
#include <vector>

#include "Route.h"

class Location {
public:
    std::string country;
    std::string capital;
    float lat;
    float lon;
    std::vector<Route*> routes;
    Location* previous;
    Route* previousRoute;
    float lengthFromStart;

    Location();
    Location(const std::string& count, const std::string& cap,
             float lt = 0.0f, float lg = 0.0f);
    bool operator==(const Location& rhs) const;
    bool operator<(const Location& rhs) const;
    bool operator>(const Location& rhs) const;
};

inline Location::Location()
    : lat(0.0f), lon(0.0f), previous(nullptr), previousRoute(nullptr),
      lengthFromStart(std::numeric_limits<float>::infinity()) {}

inline Location::Location(const std::string& count, const std::string& cap,
                          float lt, float lg)
    : country(count), capital(cap), lat(lt), lon(lg), previous(nullptr),
      previousRoute(nullptr),
      lengthFromStart(std::numeric_limits<float>::infinity()) {}

inline bool Location::operator==(const Location& rhs) const {
    return country == rhs.country;
}

inline bool Location::operator<(const Location& rhs) const {
    return lengthFromStart < rhs.lengthFromStart;
}

inline bool Location::operator>(const Location& rhs) const {
    return lengthFromStart > rhs.lengthFromStart;
}

struct compareLocation {
    bool operator()(const Location* lhs, const Location* rhs) const {
        return lhs->lengthFromStart > rhs->lengthFromStart;
    }
};

#endif
