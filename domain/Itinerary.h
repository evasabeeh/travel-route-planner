#ifndef TRAVEL_DOMAIN_ITINERARY_H
#define TRAVEL_DOMAIN_ITINERARY_H

#include <string>
#include <vector>

#include "CostDuration.h"
#include "RouteSegment.h"

namespace travel {

struct Itinerary {
    std::string origin;
    std::string destination;
    CostDuration totals;
    unsigned int transfers;
    std::vector<RouteSegment> segments;
};

}  // namespace travel

#endif
