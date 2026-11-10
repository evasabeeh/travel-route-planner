#ifndef ROUTE_H
#define ROUTE_H

#include <string>

class Location;

const float MULTI = 3.0f;

class Route {
public:
    Location* origin;
    Location* destination;
    std::string originS;
    std::string destinationS;
    std::string transport;
    float time;
    float cost;
    std::string note;

    Route();
    Route(Location* org, Location* dest, const std::string& trans,
          float tim, float cst, const std::string& notee);
    bool doesConnect(const Location* start, const Location* end) const;
};

inline Route::Route()
    : origin(nullptr), destination(nullptr), time(0.0f), cost(0.0f) {}

inline Route::Route(Location* org, Location* dest, const std::string& trans,
                    float tim, float cst, const std::string& notee)
    : origin(org), destination(dest), transport(trans), time(tim),
      cost(trans == "plane" ? cst * MULTI : cst), note(notee) {}

inline bool Route::doesConnect(const Location* start, const Location* end) const {
    return start != nullptr && end != nullptr && origin == start && destination == end;
}

#endif
