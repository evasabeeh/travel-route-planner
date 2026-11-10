CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -Wpedantic

all:
	$(CXX) $(CXXFLAGS) Main.cpp -o travel.exe

clean:
	del /Q travel.exe Main.exe 2>NUL