#ifndef TRAVEL_GEMINI_CLIENT_H
#define TRAVEL_GEMINI_CLIENT_H

#include <cstdlib>
#include <stdexcept>
#include <string>

#ifdef _WIN32
#include <windows.h>
#include <winhttp.h>
#endif

namespace travel {

struct AiPreferences {
    std::string origin;
    std::string destination;
    std::string preference;
    std::string transportTypes;
    int maximumTransfers = -1;
};

class GeminiClient {
public:
    static std::string extract(const std::string& prompt) {
        const std::string instruction =
            "Extract travel preferences from the user's request. Return JSON only with "
            "origin, destination, preference (fastest or cheapest), transportTypes "
            "(array containing plane, train, bus), and maximumTransfers (integer or null). "
            "Use empty strings when origin or destination is missing. User request: " + prompt;
        return request(instruction, true);
    }

    static std::string explain(const std::string& itineraryJson) {
        return request(
            "Explain this deterministic travel itinerary in two concise sentences. "
            "Do not invent facts and state that the routing result is calculated by the planner. "
            "Itinerary JSON: " + itineraryJson, false);
    }

private:
    static std::string apiKey() {
        const char* key = std::getenv("GEMINI_API_KEY");
        if (key == nullptr || *key == '\0') {
            throw std::runtime_error("AI features are unavailable: GEMINI_API_KEY is not configured.");
        }
        return key;
    }

    static std::string jsonEscape(const std::string& value) {
        std::string result;
        for (char character : value) {
            if (character == '"' || character == '\\') result += '\\';
            if (character == '\n') result += "\\n";
            else if (character != '\r') result += character;
        }
        return result;
    }

    static std::string request(const std::string& prompt, bool jsonResponse) {
        const std::string key = apiKey();
#ifdef _WIN32
        HINTERNET session = WinHttpOpen(L"Wayfinder/1.0",
            WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME,
            WINHTTP_NO_PROXY_BYPASS, 0);
        if (!session) throw std::runtime_error("Unable to initialize the AI client.");
        HINTERNET connection = WinHttpConnect(session, L"generativelanguage.googleapis.com",
            INTERNET_DEFAULT_HTTPS_PORT, 0);
        if (!connection) {
            WinHttpCloseHandle(session);
            throw std::runtime_error("Unable to connect to the Gemini API.");
        }
        HINTERNET requestHandle = WinHttpOpenRequest(connection, L"POST",
            L"/v1beta/models/gemini-2.0-flash:generateContent",
            nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES,
            WINHTTP_FLAG_SECURE);
        if (!requestHandle) {
            WinHttpCloseHandle(connection);
            WinHttpCloseHandle(session);
            throw std::runtime_error("Unable to create the Gemini request.");
        }
        const std::string body = "{\"contents\":[{\"parts\":[{\"text\":\"" +
            jsonEscape(prompt) + "\"}]}],\"generationConfig\":{\"temperature\":0.1" +
            (jsonResponse ? ",\"responseMimeType\":\"application/json\"" : "") + "}}";
        const std::wstring headers = L"Content-Type: application/json\r\nX-goog-api-key: " +
            std::wstring(key.begin(), key.end());
        const BOOL sent = WinHttpSendRequest(requestHandle, headers.c_str(),
            static_cast<DWORD>(-1L), const_cast<char*>(body.c_str()),
            static_cast<DWORD>(body.size()), static_cast<DWORD>(body.size()), 0);
        if (!sent || !WinHttpReceiveResponse(requestHandle, nullptr)) {
            WinHttpCloseHandle(requestHandle);
            WinHttpCloseHandle(connection);
            WinHttpCloseHandle(session);
            throw std::runtime_error("Gemini API request failed.");
        }
        std::string response;
        DWORD available = 0;
        do {
            if (!WinHttpQueryDataAvailable(requestHandle, &available) || available == 0) break;
            std::string chunk(available, '\0');
            DWORD read = 0;
            if (!WinHttpReadData(requestHandle, &chunk[0], available, &read)) break;
            response.append(chunk, 0, read);
        } while (available > 0);
        WinHttpCloseHandle(requestHandle);
        WinHttpCloseHandle(connection);
        WinHttpCloseHandle(session);
        const std::string marker = "\"text\":";
        const std::size_t start = response.find(marker);
        if (start == std::string::npos) throw std::runtime_error("Gemini returned no usable content.");
        const std::size_t quote = response.find('"', start + marker.size());
        if (quote == std::string::npos) throw std::runtime_error("Gemini returned invalid content.");
        std::string result;
        bool escaped = false;
        for (std::size_t i = quote + 1; i < response.size(); ++i) {
            const char character = response[i];
            if (!escaped && character == '"') return result;
            if (escaped) {
                result += character == 'n' ? '\n' : character;
                escaped = false;
            } else if (character == '\\') escaped = true;
            else result += character;
        }
        throw std::runtime_error("Gemini returned an incomplete response.");
#else
        (void)prompt;
        (void)jsonResponse;
        throw std::runtime_error("AI features are only supported on the Windows API server.");
#endif
    }
};

}  // namespace travel

#endif
