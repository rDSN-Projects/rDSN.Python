// python_helper.cpp : Defines the entry point for the console application.
//

# include <dsn/service_api_c.h>
# include <dsn/ports.h>
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
	PyArg_Parse(pReturn, "k", &result);

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
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("k", *(uint64_t*)&app));
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
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("k", *(uint64_t*)&app));
	PyTuple_SetItem(pArgs, 1, Py_BuildValue("i", *(int*)&cleanup));

	pReturn = PyEval_CallObject(pFunc, pArgs);

	PyGILState_Release(gstate);
	return;
}

static __thread struct __tls_handler_function__
{
	int magic;
	PyObject *rpc_request_function;
	PyObject *timer_function;
	PyObject *task_function;
} tls_handler_function;

PyObject* tls_get_handler_function(std::string handler_name)
{
	if (tls_handler_function.magic != 0xdeadbeef)
	{
		// initialization goes here
		tls_handler_function.magic = 0xdeadbeef;
		PyGILState_STATE gstate;
		gstate = PyGILState_Ensure();
		
		// on_request_handler
		PyObject* pFunc1 = NULL;
		PyObject* pModule1 = NULL;
		PyObject* pDict1 = NULL;
		PyObject* pClass1 = NULL;
		pModule1 = PyImport_ImportModule("dev.python.InterOpLookupTable");
		pDict1 = PyModule_GetDict(pModule1);
		pClass1 = PyDict_GetItemString(pDict1, "InterOpLookupTable");
		pFunc1 = PyObject_GetAttrString(pClass1, "on_request_handler");
		tls_handler_function.rpc_request_function = pFunc1;

		// on_timer_handler
		PyObject* pFunc2 = NULL;
		PyObject* pModule2 = NULL;
		PyObject* pDict2 = NULL;
		PyObject* pClass2 = NULL;
		pModule2 = PyImport_ImportModule("dev.python.InterOpLookupTable");
		pDict2 = PyModule_GetDict(pModule2);
		pClass2 = PyDict_GetItemString(pDict2, "InterOpLookupTable");
		pFunc2 = PyObject_GetAttrString(pClass2, "on_timer_handler");
		tls_handler_function.timer_function = pFunc2;
		
		// task_handler
		PyObject* pFunc3 = NULL;
		PyObject* pModule3 = NULL;
		PyObject* pDict3 = NULL;
		PyObject* pClass3 = NULL;
		pModule3 = PyImport_ImportModule("dev.python.InterOpLookupTable");
		pDict3 = PyModule_GetDict(pModule3);
		pClass3 = PyDict_GetItemString(pDict3, "InterOpLookupTable");
		pFunc3 = PyObject_GetAttrString(pClass3, "task_handler");
		tls_handler_function.task_function = pFunc3;

		PyGILState_Release(gstate);
	}
	if (handler_name == "on_request_handler")
		return tls_handler_function.rpc_request_function;
	else if (handler_name == "on_timer_handler")
		return tls_handler_function.timer_function;
	else if (handler_name == "task_handler")
		return tls_handler_function.task_function;
	else
		perror("handler function not found");
	return nullptr;
}

DSN_PY_API void dsn_run_helper(int argc, char** argv, bool sleep_after_init)
{
	dsn_run(argc, argv, sleep_after_init);
}

DSN_PY_API bool dsn_register_app_role_helper(const char* type_name, const char* create, const char* start, dsn_app_destroy destroy)
{
	return dsn_register_app_role(type_name, app_create, app_start, destroy);
}

static void task_handler(void *param)
{
	// task handler start
	// acquire Python's Global Interpreter Lock (GIL) before calling any Python API functions
	PyGILState_STATE gstate;
	gstate = PyGILState_Ensure();

	PyObject* pArgs = PyTuple_New(1);
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("k", *(uint64_t*)&param));
	PyObject* pFunc = tls_get_handler_function("task_handler");
	PyObject* pReturn = PyEval_CallObject(pFunc, pArgs);
	
	PyGILState_Release(gstate);
	// task handler end
	return;
}

DSN_PY_API dsn_task_t dsn_task_create_helper(dsn_task_code_t code, uint64_t param, int hash, dsn_task_tracker_t tracker)
{
	return dsn_task_create(code, task_handler, (void *)param, hash, tracker);
}

DSN_PY_API dsn_task_t dsn_task_create_timer_helper(dsn_task_code_t code, uint64_t param, int hash, int interval_milliseconds, dsn_task_tracker_t tracker)
{
	return dsn_task_create_timer(code, task_handler, &param, hash, interval_milliseconds, tracker);
}

DSN_PY_API void dsn_task_call_helper(dsn_task_t task, int delay_milliseconds)
{
	return dsn_task_call(task, delay_milliseconds); // set tracker null
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

	PyObject* pArgs = PyTuple_New(2);
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("s", buffer));
	PyTuple_SetItem(pArgs, 1, Py_BuildValue("k", *(uint64_t*)&param));
	PyObject* pFunc = tls_get_handler_function("on_timer_handler");
	PyObject* pReturn = PyEval_CallObject(pFunc, pArgs);

	PyGILState_Release(gstate);
	return;
}

// dsn_rpc_create_response_task(dsn_message_t request, dsn_rpc_response_handler_t cb, IntPtr param, int reply_hash);
DSN_PY_API dsn_task_t dsn_rpc_create_response_task_helper(dsn_message_t msg, uint64_t param, int reply_hash, dsn_task_tracker_t tracker)
{
	return dsn_rpc_create_response_task(msg, rpc_response_handler, (void *)param, reply_hash, tracker);
}

// dsn_rpc_call(ref dsn_address_t server, dsn_task_t rpc_call, dsn_task_tracker_t tracker);
DSN_PY_API void dsn_rpc_call_helper(uint64_t addr, dsn_task_t rpc_call)
{
	dsn_rpc_call(*(dsn_address_t*)&addr, rpc_call); // set tracker null
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
	PyTuple_SetItem(pArgs, 1, Py_BuildValue("k", *(uint64_t*)&rpc_response));
	PyTuple_SetItem(pArgs, 2, Py_BuildValue("k", *(uint64_t*)&param));
	PyObject* pFunc = tls_get_handler_function("on_request_handler");
	PyObject* pReturn = PyEval_CallObject(pFunc, pArgs);

	PyGILState_Release(gstate);
	return;
}

// bool dsn_rpc_register_handler(dsn_task_code_t code, const char* name, dsn_rpc_request_handler_t cb, void* param)
DSN_PY_API bool dsn_rpc_register_handler_helper(dsn_task_code_t code, const char* name, uint64_t param)
{
	return dsn_rpc_register_handler(code, name, rpc_request_handler, (void *)param);
}

DSN_PY_API PyObject* dsn_cli_run_helper(const char* command_line)
{
	const char* str = dsn_cli_run(command_line);
	PyObject* res = Py_BuildValue("s", dsn_cli_run(command_line));
	dsn_cli_free(str);
	return res;
}
