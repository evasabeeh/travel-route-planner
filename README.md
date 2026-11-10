<br/>
<p align="center">
  <img src="Output.png" alt="View" width="500" height="250"/> 
  <h3 align="center">Optimized Travel Route Planner</h3>

  <p align="center">
     <em>The optimal travel route planner between two countries via flights, trains or buses, based on two options, ie, the fastest or the cheapest.</em>
    <br/>
    <br/>
  </p>
</p>

## Built With

<p>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/cplusplus/cplusplus-original.svg" alt="C++" width="80" height="80"/> 
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/c/c-original.svg" alt="C" width="80" height="80"/>
</p>

## Specifications

- Optimized travel route plan
- Route visualisation on Google Map
- Uses Graph data structure
- Via flight
- Fastest or cheapest preference

## Implementation

- CMake build system used
- Takes two countries as an input
- Generates an .html file displaying the path
- Data for routes and cities are taken through .csv file
- Graph holds location as nodes and routes as edges
- Dijkstra's algorithm determines the shortest path between the origin and destination

## Build

Configure and build with CMake:

`cmake -S . -B build -DCMAKE_BUILD_TYPE=Release`

`cmake --build build --config Release`

For a debug build, use `-DCMAKE_BUILD_TYPE=Debug` and build with the
corresponding configuration.

Run the automated tests with:

`ctest --test-dir build --output-on-failure -C Release`

## Usage

Run:

`travel.exe <output.html> <origin-country> <destination-country> <fastest|cheapest>`

The program reports invalid countries, malformed input files, and unreachable
destinations without generating a route. Run the executable from the project
directory so it can find `locations.csv` and `routes.csv`.

## Architecture

- `domain/` contains locations, routes, and route results.
- `routing/` contains the graph, scoring policy, and Dijkstra algorithm.
- `data/` loads validated CSV data into a graph.
- `cli/` contains HTML presentation and command-line orchestration in `cli/Main.cpp`.

The routing layer returns a `PathResult` and has no dependency on command-line
input or HTML generation, so it can be reused by another frontend or API.