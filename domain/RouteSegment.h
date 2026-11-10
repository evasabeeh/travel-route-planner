#ifndef TRAVEL_DOMAIN_ROUTE_SEGMENT_H
#define TRAVEL_DOMAIN_ROUTE_SEGMENT_H

#include <string>

#include "CostDuration.h"
#include "Location.h"
#include "TransportType.h"

namespace travel {

struct RouteSegment {
    Location origin;
    Location destination;
    TransportType transport;
    CostDuration metrics;
    std::string note;
};

}  // namespace travel

#endif
