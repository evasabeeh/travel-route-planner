#ifndef TRAVEL_DOMAIN_TRANSPORT_TYPE_H
#define TRAVEL_DOMAIN_TRANSPORT_TYPE_H

#include <string>

namespace travel {

enum class TransportType { Plane, Train, Bus, Other };

inline TransportType transportTypeFromString(const std::string& value) {
    if (value == "plane") return TransportType::Plane;
    if (value == "train") return TransportType::Train;
    if (value == "bus") return TransportType::Bus;
    return TransportType::Other;
}

inline std::string transportTypeName(TransportType type) {
    switch (type) {
    case TransportType::Plane: return "plane";
    case TransportType::Train: return "train";
    case TransportType::Bus: return "bus";
    default: return "other";
    }
}

}  // namespace travel

#endif
