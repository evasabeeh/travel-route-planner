CXX ?= g++
CXXFLAGS ?= -std=c++11 -Wall -Wextra -Wpedantic

all:
	$(CXX) $(CXXFLAGS) -o travel cli/Main.cpp

test:
	$(CXX) $(CXXFLAGS) -o core_tests tests/core_tests.cpp
	./core_tests