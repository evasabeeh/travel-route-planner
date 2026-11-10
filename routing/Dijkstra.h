#ifndef TRAVEL_ROUTING_DIJKSTRA_H
#define TRAVEL_ROUTING_DIJKSTRA_H

#include <algorithm>
#include <cmath>
#include <functional>
#include <limits>
#include <map>
#include <queue>
#include <string>
#include <utility>

#include "Graph.h"
#include "RouteScorer.h"
#include "../domain/PathResult.h"

namespace travel {

class Dijkstra {
public:
    static PathResult find(const Graph& graph, const std::string& originCountry,
                           const std::string& destinationCountry,
                           RouteCriterion criterion) {
        PathResult result = {false, 0.0f, "", {}, {}};
        const Location* origin = graph.findByCountry(originCountry);
        const Location* destination = graph.findByCountry(destinationCountry);
        if (origin == nullptr) {
            result.error = "Origin country not found: " + originCountry;
            return result;
        }
        if (destination == nullptr) {
            result.error = "Destination country not found: " + destinationCountry;
            return result;
        }
        if (origin == destination) {
            result.error = "Origin and destination must be different.";
            return result;
        }

        typedef std::pair<float, const Location*> QueueEntry;
        std::priority_queue<QueueEntry, std::vector<QueueEntry>,
                            std::greater<QueueEntry>> queue;
        std::map<const Location*, float> distance;
        std::map<const Location*, const Location*> previous;
        std::map<const Location*, const Route*> previousRoute;
        for (const std::unique_ptr<Location>& location : graph.locations()) {
            distance[location.get()] = std::numeric_limits<float>::infinity();
        }
        distance[origin] = 0.0f;
        queue.push(std::make_pair(0.0f, origin));

        while (!queue.empty()) {
            const QueueEntry current = queue.top();
            queue.pop();
            if (current.first > distance[current.second]) continue;
            if (current.second == destination) break;
            for (const std::unique_ptr<Route>& route : graph.routes()) {
                if (route->origin != current.second) continue;
                const float candidate = current.first + RouteScorer::score(*route, criterion);
                if (candidate < distance[route->destination]) {
                    distance[route->destination] = candidate;
                    previous[route->destination] = current.second;
                    previousRoute[route->destination] = route.get();
                    queue.push(std::make_pair(candidate, route->destination));
                }
            }
        }

        if (!std::isfinite(distance[destination])) {
            result.error = "No route found from " + originCountry + " to " +
                           destinationCountry + ".";
            return result;
        }
        result.found = true;
        result.totalWeight = distance[destination];
        for (const Location* current = destination; current != nullptr;) {
            result.locations.push_back(current);
            if (current == origin) break;
            result.routes.push_back(previousRoute[current]);
            current = previous[current];
        }
        std::reverse(result.locations.begin(), result.locations.end());
        std::reverse(result.routes.begin(), result.routes.end());
        return result;
    }
};

}  // namespace travel

#endif
