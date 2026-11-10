#ifndef TRAVEL_DOMAIN_PATH_RESULT_H
#define TRAVEL_DOMAIN_PATH_RESULT_H

#include <string>
#include <vector>

#include "Location.h"
#include "Route.h"

namespace travel {

struct PathResult {
    bool found;
    float totalWeight;
    std::string error;
    std::vector<const Location*> locations;
    std::vector<const Route*> routes;
};

}  // namespace travel

#endif
