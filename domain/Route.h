#ifndef TRAVEL_DOMAIN_ROUTE_H
#define TRAVEL_DOMAIN_ROUTE_H

#include <string>

#include "Location.h"
#include "TransportType.h"

namespace travel {

const float PLANE_COST_MULTIPLIER = 3.0f;

struct Route {
    const Location* origin;
    const Location* destination;
    TransportType transport;
    float time;
    float cost;
    std::string note;
};

}  // namespace travel

#endif
