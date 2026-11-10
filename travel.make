CXX ?= g++
CXXFLAGS ?= -std=c++11 -Wall -Wextra -Wpedantic

.PHONY: all api test

all:
	$(CXX) $(CXXFLAGS) -o travel cli/Main.cpp

api:
	$(CXX) $(CXXFLAGS) -o travel_api api/HttpServer.cpp -lws2_32

test:
	$(CXX) $(CXXFLAGS) -o core_tests tests/core_tests.cpp
	./core_tests
	$(CXX) $(CXXFLAGS) -o api_tests tests/api_tests.cpp
	./api_tests