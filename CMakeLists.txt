cmake_minimum_required(VERSION 3.15)

project(travel_route_planner LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(travel cli/Main.cpp)
target_include_directories(travel PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

if(MSVC)
    target_compile_options(travel PRIVATE /W4 /permissive-)
else()
    target_compile_options(travel PRIVATE -Wall -Wextra -Wpedantic)
endif()

include(CTest)
if(BUILD_TESTING)
    add_executable(core_tests tests/core_tests.cpp)
    target_include_directories(core_tests PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
    if(MSVC)
        target_compile_options(core_tests PRIVATE /W4 /permissive-)
    else()
        target_compile_options(core_tests PRIVATE -Wall -Wextra -Wpedantic)
    endif()
    add_test(NAME core_tests COMMAND core_tests)
    set_tests_properties(core_tests PROPERTIES
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    )
endif()
