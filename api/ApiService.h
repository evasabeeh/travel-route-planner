#ifndef TRAVEL_API_SERVICE_H
#define TRAVEL_API_SERVICE_H

#include <cstdlib>
#include <sstream>
#include <stdexcept>
#include <string>

#include "../data/CsvParser.h"
#include "../routing/Dijkstra.h"

namespace travel {

struct ApiRequest {
    std::string method;
    std::string path;
    std::string body;
};

struct ApiResponse {
    int status;
    std::string body;
    std::string contentType;
};

class ApiService {
public:
    explicit ApiService(const Graph& graph) : graph_(graph) {}

    ApiResponse handle(const ApiRequest& request) const {
        try {
            if (request.method == "GET" && request.path == "/locations") {
                return locationsJson();
            }
            if (request.method == "POST" && request.path == "/routes/search") {
                return search(request.body);
            }
            if (request.method == "GET" && request.path.find("/routes/") == 0) {
                return routeJson(request.path.substr(8));
            }
            return error(404, "NOT_FOUND", "Endpoint not found.");
        } catch (const std::exception& exception) {
            return error(400, "INVALID_REQUEST", exception.what());
        }
    }

private:
    const Graph& graph_;

    static std::string escape(const std::string& value) {
        std::string result;
        for (char character : value) {
            if (character == '"' || character == '\\') result += '\\';
            result += character == '\n' || character == '\r' ? ' ' : character;
        }
        return result;
    }

    static ApiResponse error(int status, const std::string& code,
                             const std::string& message) {
        return {status, "{\"error\":{\"code\":\"" + escape(code) +
                       "\",\"message\":\"" + escape(message) + "\"}}",
                "application/json"};
    }

    static std::string value(const std::string& body, const std::string& key) {
        const std::string marker = "\"" + key + "\"";
        const std::size_t keyPosition = body.find(marker);
        if (keyPosition == std::string::npos) return "";
        const std::size_t colon = body.find(':', keyPosition + marker.size());
        if (colon == std::string::npos) return "";
        std::size_t start = body.find('"', colon + 1);
        if (start == std::string::npos) return "";
        ++start;
        const std::size_t end = body.find('"', start);
        if (end == std::string::npos) throw std::runtime_error("Invalid JSON string.");
        return body.substr(start, end - start);
    }

    static int integerValue(const std::string& body, const std::string& key, int fallback) {
        const std::string marker = "\"" + key + "\"";
        const std::size_t keyPosition = body.find(marker);
        if (keyPosition == std::string::npos) return fallback;
        const std::size_t colon = body.find(':', keyPosition + marker.size());
        if (colon == std::string::npos) throw std::runtime_error("Invalid JSON field.");
        return std::atoi(body.substr(colon + 1).c_str());
    }

    static std::string stringArray(const std::string& body, const std::string& key) {
        const std::string marker = "\"" + key + "\"";
        const std::size_t keyPosition = body.find(marker);
        if (keyPosition == std::string::npos) return "";
        const std::size_t start = body.find('[', keyPosition);
        const std::size_t end = body.find(']', start);
        if (start == std::string::npos || end == std::string::npos) {
            throw std::runtime_error("Invalid transportTypes array.");
        }
        return body.substr(start, end - start);
    }

    ApiResponse locationsJson() const {
        std::ostringstream json;
        json << "{\"locations\":[";
        for (std::size_t i = 0; i < graph_.locations().size(); ++i) {
            if (i != 0) json << ',';
            const Location& location = *graph_.locations()[i];
            json << "{\"country\":\"" << escape(location.country)
                 << "\",\"capital\":\"" << escape(location.capital)
                 << "\",\"latitude\":" << location.latitude
                 << ",\"longitude\":" << location.longitude << '}';
        }
        json << "]}";
        return {200, json.str(), "application/json"};
    }

    ApiResponse routeJson(const std::string& identifier) const {
        char* end = nullptr;
        const long index = std::strtol(identifier.c_str(), &end, 10);
        if (*identifier.c_str() == '\0' || *end != '\0' ||
            index < 0 || static_cast<std::size_t>(index) >= graph_.routes().size()) {
            return error(404, "ROUTE_NOT_FOUND", "Route id was not found.");
        }
        const Route& route = *graph_.routes()[static_cast<std::size_t>(index)];
        std::ostringstream json;
        json << "{\"id\":" << index << ",\"origin\":\""
             << escape(route.origin->country) << "\",\"destination\":\""
             << escape(route.destination->country) << "\",\"transport\":\""
             << transportTypeName(route.transport) << "\",\"cost\":" << route.cost
             << ",\"duration\":" << route.time << ",\"note\":\""
             << escape(route.note) << "\"}";
        return {200, json.str(), "application/json"};
    }

    ApiResponse search(const std::string& body) const {
        const std::string origin = value(body, "origin");
        const std::string destination = value(body, "destination");
        const std::string preference = value(body, "preference");
        if (origin.empty() || destination.empty()) {
            return error(400, "VALIDATION_ERROR",
                         "origin and destination are required.");
        }
        RoutingOptions options;
        if (preference == "cheapest") {
            options.criterion = RouteCriterion::Cheapest;
        } else if (preference == "fastest" || preference.empty()) {
            options.criterion = RouteCriterion::Fastest;
        } else {
            return error(400, "VALIDATION_ERROR",
                         "preference must be fastest or cheapest.");
        }
        options.maximumTransfers = integerValue(body, "maximumTransfers", -1);
        if (options.maximumTransfers < -1) {
            return error(400, "VALIDATION_ERROR",
                         "maximumTransfers must be zero or greater.");
        }
        const std::string transports = stringArray(body, "transportTypes");
        for (const char* type : {"plane", "train", "bus"}) {
            if (transports.find(std::string("\"") + type + "\"") != std::string::npos) {
                options.allowedTransport.insert(transportTypeFromString(type));
            }
        }
        const PathResult result = Dijkstra::find(
            graph_, origin, destination, options);
        if (!result.found) {
            const int status = result.error.code == "NO_ROUTE" ? 404 : 400;
            return error(status, result.error.code, result.error.message);
        }
        return itineraryJson(result.itinerary);
    }

    static ApiResponse itineraryJson(const Itinerary& itinerary) {
        std::ostringstream json;
        json << "{\"origin\":\"" << escape(itinerary.origin)
             << "\",\"destination\":\"" << escape(itinerary.destination)
             << "\",\"totalCost\":" << itinerary.totals.cost
             << ",\"totalDuration\":" << itinerary.totals.duration
             << ",\"transfers\":" << itinerary.transfers << ",\"segments\":[";
        for (std::size_t i = 0; i < itinerary.segments.size(); ++i) {
            const RouteSegment& segment = itinerary.segments[i];
            if (i != 0) json << ',';
            json << "{\"origin\":" << locationJson(segment.origin)
                 << ",\"destination\":" << locationJson(segment.destination)
                 << ",\"transport\":\"" << transportTypeName(segment.transport)
                 << "\",\"cost\":" << segment.metrics.cost
                 << ",\"duration\":" << segment.metrics.duration;
            if (!segment.note.empty()) {
                json << ",\"note\":\"" << escape(segment.note) << '"';
            }
            json << '}';
        }
        json << "]}";
        return {200, json.str(), "application/json"};
    }

    static std::string locationJson(const Location& location) {
        std::ostringstream json;
        json << "{\"country\":\"" << escape(location.country)
             << "\",\"capital\":\"" << escape(location.capital)
             << "\",\"latitude\":" << location.latitude
             << ",\"longitude\":" << location.longitude << '}';
        return json.str();
    }
};

}  // namespace travel

#endif
