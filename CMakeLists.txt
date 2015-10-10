cmake_minimum_required(VERSION 2.8.8)

#set(DSN_ROOT "$ENV{DSN_ROOT}")
set(DSN_ROOT "/opt/rdsn")
if((DSN_ROOT STREQUAL "") OR (NOT EXISTS "${DSN_ROOT}/"))
    message(FATAL_ERROR "Please make sure that DSN_ROOT is defined and exists.")
endif()

message (STATUS ${DSN_ROOT} "${DSN_ROOT}/bin/dsn.cmake")
include("${DSN_ROOT}/bin/dsn.cmake")

project(dsn.python C CXX)
dsn_common_setup()

add_subdirectory(src)
