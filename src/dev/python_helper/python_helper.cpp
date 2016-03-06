// python_helper.cpp : Defines the entry point for the console application.
//

# include <dsn/service_api_cpp.h>
# include <dsn/internal/ports.h>
# include <iostream>
# include <string.h>
# include <time.h>
//# undef _DEBUG
# include "Python.h"

# if defined(_WIN32)
# define DSN_PY_API extern "C" __declspec(dllexport)
# else
# define DSN_PY_API extern "C" __attribute__((visibility("default")))
# endif

typedef int         dsn_error_t;
// rDSN allows many apps in the same process for easy deployment and test
// app ceate, start, and destroy callbacks
typedef void*       (*dsn_app_create)(          // return app_context,
	const char*     // type name registered on dsn_register_app_role
	);

typedef dsn_error_t(*dsn_app_start)(
	void*,          // context return by app_create
	int,            // argc
	char**          // argv
	);

typedef void(*dsn_app_destroy)(
	void*,          // context return by app_create
	bool            // cleanup app state or not
	);

static void* app_create(const char* tname)
{
	// acquire Python's Global Interpreter Lock (GIL) before calling any Python API functions
	PyGILState_STATE gstate;
	gstate = PyGILState_Ensure();

	PyObject* pModule = NULL;
	PyObject* pDict = NULL;
	PyObject* pClass = NULL;
	PyObject* pFunc = NULL;
	PyObject * pArgs = NULL;
	PyObject * pReturn = NULL;

	pModule = PyImport_ImportModule("dev.python.ServiceApp");
	pDict = PyModule_GetDict(pModule);
	pClass = PyDict_GetItemString(pDict, "ServiceApp");
	pFunc = PyObject_GetAttrString(pClass, "app_create");

	pArgs = PyTuple_New(1);
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("s", tname));

	pReturn = PyEval_CallObject(pFunc, pArgs);

	uint64_t result;
	PyArg_Parse(pReturn, "K", &result);

	PyGILState_Release(gstate);
	return (void*)(uint64_t)result;
}

static dsn_error_t app_start(void* app, int argc, char** argv)
{
	// acquire Python's Global Interpreter Lock (GIL) before calling any Python API functions
	PyGILState_STATE gstate;
	gstate = PyGILState_Ensure();

	PyObject* pModule = NULL;
	PyObject* pDict = NULL;
	PyObject* pClass = NULL;
	PyObject* pFunc = NULL;
	PyObject * pArgs = NULL;
	PyObject * pReturn = NULL;
	pModule = PyImport_ImportModule("dev.python.ServiceApp");

	pDict = PyModule_GetDict(pModule);
	pClass = PyDict_GetItemString(pDict, "ServiceApp");
	pFunc = PyObject_GetAttrString(pClass, "app_start");

	pArgs = PyTuple_New(3);
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("K", *(uint64_t*)&app));
	PyTuple_SetItem(pArgs, 1, Py_BuildValue("i", argc));
	PyObject* pList = PyList_New(argc);
	for (int i = 0; i < argc; i++)
	{
		PyList_SetItem(pList, i, Py_BuildValue("s", argv[i]));
	}
	PyTuple_SetItem(pArgs, 2, pList);
	pReturn = PyEval_CallObject(pFunc, pArgs);
	
	int result;
	PyArg_Parse(pReturn, "i", &result);

	PyGILState_Release(gstate);
	return result;
}

static void app_destroy(void* app, bool cleanup)
{
	// acquire Python's Global Interpreter Lock (GIL) before calling any Python API functions
	PyGILState_STATE gstate;
	gstate = PyGILState_Ensure();

	PyObject* pModule = NULL;
	PyObject* pDict = NULL;
	PyObject* pClass = NULL;
	PyObject* pFunc = NULL;
	PyObject * pArgs = NULL;
	PyObject * pReturn = NULL;

	pModule = PyImport_ImportModule("dev.python.ServiceApp");
	pDict = PyModule_GetDict(pModule);
	pClass = PyDict_GetItemString(pDict, "ServiceApp");
	pFunc = PyObject_GetAttrString(pClass, "app_destroy");

	pArgs = PyTuple_New(2);
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("K", *(uint64_t*)&app));
	PyTuple_SetItem(pArgs, 1, Py_BuildValue("i", *(int*)&cleanup));

	pReturn = PyEval_CallObject(pFunc, pArgs);

	PyGILState_Release(gstate);
	return;
}

enum callback_type
{
    CT_RPC_REQUEST = 0,
    CT_RPC_RESPONSE,
    CT_TIMER,
    CT_COMPUTE,

    CT_COUNT
};
static __thread struct __tls_handler_function__
{
	int magic;
    PyObject* callbacks[CT_COUNT];
} tls_handler_function;


PyObject* tls_get_handler_function(callback_type ct)
{
	if (tls_handler_function.magic != 0xdeadbeef)
	{
		// initialization goes here
		tls_handler_function.magic = 0xdeadbeef;
		PyGILState_STATE gstate;
		gstate = PyGILState_Ensure();
		
        // find callback lookup table
        PyObject* pModule1 = PyImport_ImportModule("dev.python.InterOpLookupTable");
        PyObject* pDict1 = PyModule_GetDict(pModule1);
        PyObject* pClass1 = PyDict_GetItemString(pDict1, "InterOpLookupTable");

        // find general callback functions
        tls_handler_function.callbacks[CT_RPC_REQUEST] =
            PyObject_GetAttrString(pClass1, "on_request_handler");
        tls_handler_function.callbacks[CT_RPC_RESPONSE] =
            PyObject_GetAttrString(pClass1, "on_response_handler");
        tls_handler_function.callbacks[CT_TIMER] =
            PyObject_GetAttrString(pClass1, "task_handler");
        tls_handler_function.callbacks[CT_COMPUTE] =
            PyObject_GetAttrString(pClass1, "timer_handler");

		PyGILState_Release(gstate);
	}

    return tls_handler_function.callbacks[ct];
}

DSN_PY_API void dsn_run_helper(int argc, char** argv, bool sleep_after_init)
{
	dsn_run(argc, argv, sleep_after_init);
}

DSN_PY_API bool dsn_register_app_role_helper(const char* type_name, const char* create, const char* start, dsn_app_destroy destroy)
{
	dsn_app app;
	memset(&app, 0, sizeof(app));
	app.mask = DSN_APP_MASK_DEFAULT;
	strncpy(app.type_name, type_name, sizeof(app.type_name));
	app.layer1.create = app_create;
	app.layer1.start = app_start;
	app.layer1.destroy = destroy;

	return dsn_register_app(&app);
}

static void task_handler(void *param)
{
	// task handler start
	// acquire Python's Global Interpreter Lock (GIL) before calling any Python API functions
	PyGILState_STATE gstate;
	gstate = PyGILState_Ensure();

	PyObject* pArgs = PyTuple_New(1);
    PyTuple_SetItem(pArgs, 0, Py_BuildValue("K", (uint64_t)(uintptr_t)param));
	PyObject* pFunc = tls_get_handler_function(CT_COMPUTE);
	PyObject* pReturn = PyEval_CallObject(pFunc, pArgs);
	
	PyGILState_Release(gstate);
	// task handler end
	return;
}

static void timer_handler(void *param)
{
    // task handler start
    // acquire Python's Global Interpreter Lock (GIL) before calling any Python API functions
    PyGILState_STATE gstate;
    gstate = PyGILState_Ensure();

    PyObject* pArgs = PyTuple_New(1);
    PyTuple_SetItem(pArgs, 0, Py_BuildValue("K", (uint64_t)(uintptr_t)param));
    PyObject* pFunc = tls_get_handler_function(CT_TIMER);
    PyObject* pReturn = PyEval_CallObject(pFunc, pArgs);

    PyGILState_Release(gstate);
    // task handler end
    return;
}

DSN_PY_API dsn_task_t dsn_task_create_helper(dsn_task_code_t code, uint64_t param, int hash, dsn_task_tracker_t tracker)
{
    return dsn_task_create(code, task_handler, (void *)(uintptr_t)param, hash, nullptr); // set tracker null
}

DSN_PY_API dsn_task_t dsn_task_create_timer_helper(dsn_task_code_t code, uint64_t param, int hash, int interval_milliseconds, dsn_task_tracker_t tracker)
{
    return dsn_task_create_timer(code, timer_handler, (void*)(uintptr_t)param, hash, interval_milliseconds, nullptr); // set tracker null
}

DSN_PY_API void dsn_task_call_helper(dsn_task_t task, int delay_milliseconds)
{
	return dsn_task_call(task, delay_milliseconds);
}

// rpc helper
DSN_PY_API uint64_t dsn_address_build_helper(const char* host, int port)
{
	dsn_address_t addr = dsn_address_build(host, port);
	return *(uint64_t*)&addr;
}

// client register rpc callback
static void rpc_response_handler(dsn_error_t err, dsn_message_t rpc_request, dsn_message_t rpc_response, void* param)
{
	// read response
	PyGILState_STATE gstate;
	gstate = PyGILState_Ensure();

	void* ptr;
	size_t size;
	char buffer[1000];
	dsn_msg_read_next(rpc_response, &ptr, &size);
	memcpy(buffer, ptr, size);
	dsn_msg_read_commit(rpc_response, size);

	PyObject* pArgs = PyTuple_New(3);
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("s", buffer));
    PyTuple_SetItem(pArgs, 1, Py_BuildValue("i", err));
	PyTuple_SetItem(pArgs, 2, Py_BuildValue("K", (uint64_t)(uintptr_t)param));
    PyObject* pFunc = tls_get_handler_function(CT_RPC_RESPONSE);
	PyObject* pReturn = PyEval_CallObject(pFunc, pArgs);

	PyGILState_Release(gstate);
	return;
}

DSN_PY_API dsn_task_t dsn_rpc_create_response_task_helper(dsn_message_t msg, uint64_t param, int reply_hash, dsn_task_tracker_t tracker)
{
	return dsn_rpc_create_response_task(msg, rpc_response_handler, (void *)param, reply_hash, nullptr); // set tracker null
}

DSN_PY_API void dsn_rpc_call_helper(uint64_t addr, dsn_task_t rpc_call)
{
	dsn_rpc_call(*(dsn_address_t*)&addr, rpc_call);
}

DSN_PY_API void* dsn_rpc_call_wait_helper(uint64_t addr, dsn_message_t msg, char *ss)
{
	dsn_message_t resp = dsn_rpc_call_wait(*(dsn_address_t*)&addr, msg);
	
	void* ptr;
	size_t size;
	dsn_msg_read_next(resp, &ptr, &size);
	memcpy(ss, ptr, size);
	dsn_msg_read_commit(resp, size);

	return (void*)ss;
}

DSN_PY_API void marshall_helper(dsn_message_t msg, char* request_content)
{
	void* ptr;
	size_t size;
	size_t count = strlen(request_content) + 1;
	dsn_msg_write_next(msg, &ptr, &size, count);
	memcpy(ptr, request_content, count);
	dsn_msg_write_commit(msg, count);
}

DSN_PY_API void marshall_int_msg_helper(int msg_int, char* request_content)
{
	dsn_message_t msg = (dsn_message_t)&msg_int;

	void* ptr;
	size_t size;
	size_t count = strlen(request_content) + 1;
	dsn_msg_write_next(msg, &ptr, &size, count);
	memcpy(ptr, request_content, count);
	dsn_msg_write_commit(msg, count);
}

// server register handler
static void rpc_request_handler(dsn_message_t rpc_request, void* param)
{
	// rpc request handler start
	PyGILState_STATE gstate;
	gstate = PyGILState_Ensure();

	void* ptr;
	size_t size;
	char buffer[1000]; // parse rpc request
	dsn_msg_read_next(rpc_request, &ptr, &size);
	memcpy(buffer, ptr, size);
	dsn_msg_read_commit(rpc_request, size);

	dsn_message_t rpc_response = dsn_msg_create_response(rpc_request);

	PyObject* pArgs = PyTuple_New(3);
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("s", buffer));
    PyTuple_SetItem(pArgs, 1, Py_BuildValue("K", (uint64_t)(uintptr_t)rpc_response));
	PyTuple_SetItem(pArgs, 2, Py_BuildValue("K", (uint64_t)(uintptr_t)param));
	PyObject* pFunc = tls_get_handler_function(CT_RPC_REQUEST);
	PyObject* pReturn = PyEval_CallObject(pFunc, pArgs);

	PyGILState_Release(gstate);
	return;
}

// bool dsn_rpc_register_handler(dsn_task_code_t code, const char* name, dsn_rpc_request_handler_t cb, void* param)
DSN_PY_API bool dsn_rpc_register_handler_helper(dsn_task_code_t code, const char* name, uint64_t param)
{
	return dsn_rpc_register_handler(code, name, rpc_request_handler, (void *)param);
}

__thread char tls_buffer[4*1024*1024];

DSN_PY_API const char* dsn_cli_run_helper(const char* command_line)
{
	const char* str = dsn_cli_run(command_line);
	int length = std::min<int>(strlen(str), 4 * 1024 * 1024 - 1);
	strncpy(tls_buffer, str, length);
	tls_buffer[length] = '\0';
	dsn_cli_free(str);
	return tls_buffer;
}

DSN_PY_API dsn_error_t dsn_app_bridge(int argc, const char** argv)
{    
    std::vector< std::string> args;
    for (int i = 0; i < argc; i++)
    {
        std::string ag(*argv++);
        args.push_back(ag);
    }

    new std::thread([=](){
        Py_Initialize();
        char* PyFileName = (char *)args[0].c_str();
        char** PyParameterList = new char* [args.size()];
        for (int i = 0;i < args.size(); ++i)
        {
            PyParameterList[i] = new char[args[i].size()+1];
            strcpy(PyParameterList[i], args[i].c_str());
        }
        PySys_SetArgv((int)args.size(), PyParameterList);
        PyObject* PyFileObject = PyFile_FromString(PyFileName, "r");
        PyRun_SimpleFile(PyFile_AsFile(PyFileObject), PyFileName);
        Py_Finalize();
        for (int i = 0; i < args.size(); ++i)
        {
            delete [] PyParameterList[i];
        }
        delete [] PyParameterList;
    });
    dsn_app_loader_wait();
    

    return dsn::ERR_OK;
}

DSN_PY_API const char* dsn_config_get_meta_server_helper()
{
    const char* server_ss[10];
    int capacity = 10, need_count;
    need_count = dsn_config_get_all_keys("meta_servers", server_ss, &capacity);
    int length = std::min<int>(strlen(server_ss[0]), 4 * 1024 * 1024 - 1);
    strncpy(tls_buffer, server_ss[0], length);
    tls_buffer[length] = '\0';
    return tls_buffer;
}