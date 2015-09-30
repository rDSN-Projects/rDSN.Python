set(MY_PROJ_NAME "dsn.dev.python_helper")
project(${MY_PROJ_NAME} C CXX)

# Source files under CURRENT project directory will be automatically included.
# You can manually set MY_PROJ_SRC to include source files under other directories.
set(MY_PROJ_SRC "")

# Search mode for source files under CURRENT project directory?
# "GLOB_RECURSE" for recursive search
# "GLOB" for non-recursive search
set(MY_SRC_SEARCH_MODE "GLOB_RECURSE")

set(MY_PROJ_INC_PATH "${PYTHONPATH}/include")

set(MY_PROJ_LIBS "python34")

set(MY_PROJ_LIB_PATH "${PYTHONPATH}/libs" "${PYTHONPATH}/lib")

# Extra files that will be installed
set(MY_BINPLACES "")

set(MY_BOOST_PACKAGES "")

dsn_common_setup()
dsn_add_shared_library()
