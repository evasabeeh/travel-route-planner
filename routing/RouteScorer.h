#ifndef TRAVEL_ROUTING_ROUTE_SCORER_H
#define TRAVEL_ROUTING_ROUTE_SCORER_H

#include "../domain/Route.h"

namespace travel {

enum class RouteCriterion { Fastest, Cheapest };

class RouteScorer {
public:
    static float score(const Route& route, RouteCriterion criterion) {
        return criterion == RouteCriterion::Cheapest ? route.cost : route.time;
    }
};

}  // namespace travel

#endif
