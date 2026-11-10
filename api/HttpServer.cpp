#include <cstdlib>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

#include "ApiService.h"

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
typedef SOCKET Socket;
const Socket InvalidSocket = INVALID_SOCKET;
#else
#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
typedef int Socket;
const Socket InvalidSocket = -1;
#endif

namespace {

void closeSocket(Socket socket) {
#ifdef _WIN32
    closesocket(socket);
#else
    close(socket);
#endif
}

bool receiveRequest(Socket client, std::string& request) {
    char buffer[4096];
    std::size_t contentLength = 0;
    bool headersRead = false;
    do {
#ifdef _WIN32
        const int received = recv(client, buffer, sizeof(buffer), 0);
#else
        const int received = static_cast<int>(recv(client, buffer, sizeof(buffer), 0));
#endif
        if (received <= 0) return false;
        request.append(buffer, static_cast<std::size_t>(received));
        if (!headersRead) {
            const std::size_t separator = request.find("\r\n\r\n");
            if (separator != std::string::npos) {
                headersRead = true;
                const std::string headers = request.substr(0, separator);
                const std::string marker = "Content-Length:";
                const std::size_t markerPosition = headers.find(marker);
                if (markerPosition != std::string::npos) {
                    contentLength = static_cast<std::size_t>(
                        std::strtoul(headers.c_str() + markerPosition + marker.size(),
                                     nullptr, 10));
                }
                if (request.size() >= separator + 4 + contentLength) return true;
            }
        } else {
            const std::size_t separator = request.find("\r\n\r\n");
            if (request.size() >= separator + 4 + contentLength) return true;
        }
    } while (request.size() < 1024 * 1024);
    return headersRead;
}

travel::ApiRequest parseRequest(const std::string& raw) {
    const std::size_t firstLineEnd = raw.find("\r\n");
    const std::size_t headersEnd = raw.find("\r\n\r\n");
    if (firstLineEnd == std::string::npos || headersEnd == std::string::npos) {
        throw std::runtime_error("Malformed HTTP request.");
    }
    std::istringstream firstLine(raw.substr(0, firstLineEnd));
    travel::ApiRequest request;
    std::string version;
    firstLine >> request.method >> request.path >> version;
    if (request.method.empty() || request.path.empty()) {
        throw std::runtime_error("Malformed HTTP request line.");
    }
    request.body = raw.substr(headersEnd + 4);
    return request;
}

void sendCorsPreflight(Socket client) {
    const std::string response =
        "HTTP/1.1 204 No Content\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Content-Length: 0\r\nConnection: close\r\n\r\n";
    send(client, response.c_str(), static_cast<int>(response.size()), 0);
}

void sendResponse(Socket client, const travel::ApiResponse& response) {
    std::ostringstream output;
    output << "HTTP/1.1 " << response.status << ' '
           << (response.status < 300 ? "OK" : response.status == 404 ? "Not Found" : "Bad Request")
           << "\r\nContent-Type: " << response.contentType
           << "\r\nAccess-Control-Allow-Origin: *"
           << "\r\nContent-Length: " << response.body.size()
           << "\r\nConnection: close\r\n\r\n" << response.body;
    const std::string serialized = output.str();
    send(client, serialized.c_str(), static_cast<int>(serialized.size()), 0);
}

}  // namespace

int main() {
#ifdef _WIN32
    WSADATA data;
    if (WSAStartup(MAKEWORD(2, 2), &data) != 0) {
        std::cerr << "Unable to initialize Windows sockets.\n";
        return 1;
    }
#endif
    try {
        const travel::Graph graph = travel::CsvParser::load("locations.csv", "routes.csv");
        const travel::ApiService api(graph);
        const Socket server = socket(AF_INET, SOCK_STREAM, 0);
        if (server == InvalidSocket) throw std::runtime_error("Unable to create server socket.");

        sockaddr_in address = {};
        address.sin_family = AF_INET;
        address.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
        address.sin_port = htons(8080);
        if (bind(server, reinterpret_cast<sockaddr*>(&address), sizeof(address)) != 0 ||
            listen(server, 16) != 0) {
            closeSocket(server);
            throw std::runtime_error("Unable to bind API server to http://localhost:8080.");
        }
        std::cout << "Routing API listening at http://localhost:8080\n";
        while (true) {
            Socket client = accept(server, nullptr, nullptr);
            if (client == InvalidSocket) continue;
            travel::ApiResponse response;
            try {
                std::string raw;
                if (!receiveRequest(client, raw)) {
                    response = {400, "{\"error\":{\"code\":\"INVALID_REQUEST\","
                                  "\"message\":\"Could not read request.\"}}",
                                 "application/json"};
                } else {
                    const travel::ApiRequest request = parseRequest(raw);
                    if (request.method == "OPTIONS") {
                        sendCorsPreflight(client);
                        closeSocket(client);
                        continue;
                    }
                    response = api.handle(request);
                }
            } catch (const std::exception& error) {
                response = {400, std::string("{\"error\":{\"code\":\"INVALID_REQUEST\","
                                             "\"message\":\"") + error.what() + "\"}}",
                            "application/json"};
            }
            sendResponse(client, response);
            closeSocket(client);
        }
    } catch (const std::exception& error) {
        std::cerr << "API server error: " << error.what() << '\n';
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }
}
