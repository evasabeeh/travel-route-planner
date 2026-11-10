#ifndef TRAVEL_DOMAIN_LOCATION_H
#define TRAVEL_DOMAIN_LOCATION_H

#include <string>

namespace travel {

struct Location {
    std::string country;
    std::string capital;
    float latitude;
    float longitude;
};

}  // namespace travel

#endif
