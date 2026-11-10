#ifndef TRAVEL_DOMAIN_ERROR_RESPONSE_H
#define TRAVEL_DOMAIN_ERROR_RESPONSE_H

#include <string>

namespace travel {

struct ErrorResponse {
    std::string code;
    std::string message;

    bool hasError() const { return !code.empty(); }
};

}  // namespace travel

#endif
