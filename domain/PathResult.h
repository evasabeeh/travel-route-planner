#ifndef TRAVEL_DOMAIN_PATH_RESULT_H
#define TRAVEL_DOMAIN_PATH_RESULT_H

#include "ErrorResponse.h"
#include "Itinerary.h"

namespace travel {

struct PathResult {
    bool found;
    Itinerary itinerary;
    ErrorResponse error;
};

}  // namespace travel

#endif
