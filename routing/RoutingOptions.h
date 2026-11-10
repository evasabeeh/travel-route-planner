#ifndef TRAVEL_ROUTING_ROUTING_OPTIONS_H
#define TRAVEL_ROUTING_ROUTING_OPTIONS_H

#include <set>

#include "../domain/TransportType.h"
#include "RouteScorer.h"

namespace travel {

struct RoutingOptions {
    RouteCriterion criterion;
    std::set<TransportType> allowedTransport;
    int maximumTransfers;

    RoutingOptions()
        : criterion(RouteCriterion::Fastest), maximumTransfers(-1) {}
};

}  // namespace travel

#endif
