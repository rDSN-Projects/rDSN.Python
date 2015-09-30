// python_helper.cpp : Defines the entry point for the console application.
//

# include "stdafx.h"
# include <dsn/service_api_c.h>
# include <dsn/ports.h>
# include <iostream>

//# undef _DEBUG
# include "C:\python\include\Python.h"

typedef int         dsn_error_t;
// rDSN allows many apps in the same process for easy deployment and test
// app ceate, start, and destroy callbacks
typedef void*       (*dsn_app_create)(          // return app_context,
	const char*     // type name registered on dsn_register_app_role
	);

typedef dsn_error_t (*dsn_app_start)(
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

	int result;
	PyArg_Parse(pReturn, "i", &result);

	PyGILState_Release(gstate);
	return (void*)result;
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
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("i", (int)app));
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
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("i", (int)app));
	PyTuple_SetItem(pArgs, 1, Py_BuildValue("i", (int)cleanup));

	pReturn = PyEval_CallObject(pFunc, pArgs);

	PyGILState_Release(gstate);
	return;
}

typedef struct
{
	int type;
	int port;
	int ip;
	char ipv6[4];
	char uri[1000];
}dsn_address_t1;

typedef struct
{
	int a;
	int b;
}struct_test;

extern "C"
{
	__declspec(dllexport) bool dsn_register_app_role_helper(const char* type_name, const char* create, const char* start, dsn_app_destroy destroy);
	__declspec(dllexport) void dsn_run_helper(int argc, char** argv, bool sleep_after_init);
	__declspec(dllexport) void dsn_task_call_helper(dsn_task_t task, dsn_task_tracker_t tracker, int delay_milliseconds);
	__declspec(dllexport) dsn_task_t dsn_task_create_helper(dsn_task_code_t code, void* param, int hash);
	__declspec(dllexport) dsn_task_t dsn_task_create_timer_helper(dsn_task_code_t code, void* param, int hash, int interval_milliseconds);
	__declspec(dllexport) void dsn_address_build_helper(dsn_address_t1* addr, const char* host, int port);
	__declspec(dllexport) void dsn_rpc_call_helper(dsn_address_t1* addr, dsn_task_t rpc_call, dsn_task_tracker_t tracker);
	__declspec(dllexport) void* dsn_rpc_call_wait_helper(dsn_address_t1* addr, dsn_message_t msg, char *ss);
	__declspec(dllexport) dsn_task_t dsn_rpc_create_response_task_helper(dsn_message_t msg, int param, int reply_hash);
	__declspec(dllexport) dsn_message_t dsn_msg_create_request_helper(dsn_task_code_t code, int timeout_milliseconds, int request_hash);
	__declspec(dllexport) dsn_task_code_t dsn_task_code_register_helper(const char* name, int type, int pri, dsn_threadpool_code_t pool);
	__declspec(dllexport) void marshall_helper(dsn_message_t msg, char* request_content);
	__declspec(dllexport) bool dsn_rpc_register_handler_helper(dsn_task_code_t code, const char* name, int param);
	__declspec(dllexport) void marshall_int_msg_helper(int msg_int, char* request_content);
};


void dsn_run_helper(int argc, char** argv, bool sleep_after_init)
{
	dsn_run(argc, argv, sleep_after_init);
}

bool dsn_register_app_role_helper(const char* type_name, const char* create, const char* start, dsn_app_destroy destroy)
{
	return dsn_register_app_role(type_name, app_create, app_start, destroy);
}

static void task_handler(void *param)
{
	// task handler start
	// acquire Python's Global Interpreter Lock (GIL) before calling any Python API functions
	PyGILState_STATE gstate;
	gstate = PyGILState_Ensure();

	PyObject* pModule = NULL;
	PyObject* pDict = NULL;
	PyObject* pClass = NULL;
	PyObject* pFunc = NULL;
	PyObject * pArgs = NULL;
	PyObject * pReturn = NULL;
	pModule = PyImport_ImportModule("dev.python.InterOpLookupTable");
	pDict = PyModule_GetDict(pModule);
	pClass = PyDict_GetItemString(pDict, "InterOpLookupTable");
	pFunc = PyObject_GetAttrString(pClass, "task_handler");

	pArgs = PyTuple_New(1);
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("i", (int)param));
	pReturn = PyEval_CallObject(pFunc, pArgs);

	// task handler end
	PyGILState_Release(gstate);
	return;
}

dsn_task_t dsn_task_create_helper(dsn_task_code_t code, void* param, int hash)
{
	return dsn_task_create(code, task_handler, (void *)param, hash);
}

dsn_task_t dsn_task_create_timer_helper(dsn_task_code_t code, void* param, int hash, int interval_milliseconds)
{
	return dsn_task_create_timer(code, task_handler, (void *)param, hash, interval_milliseconds);
}

void dsn_task_call_helper(dsn_task_t task, dsn_task_tracker_t tracker, int delay_milliseconds)
{
	return dsn_task_call(task, nullptr, delay_milliseconds); // set tracker null
}

// rpc helper
void dsn_address_build_helper(dsn_address_t1* addr, const char* host, int port)
{
	dsn_address_t* addr_c = new dsn_address_t();

	dsn_address_build(addr_c, host, port);
	addr->ip = addr_c->ip;
	addr->port = addr_c->port;
}

static __thread struct __tls_timer_function__
{
	int magic;
	PyObject *timer_function;
} tls_timer_function;

PyObject* tls_get_rpc_response_function()
{
	if (tls_timer_function.magic != 0xdeadbeef)
	{
		// initialization goes here
		tls_timer_function.magic = 0xdeadbeef;
		PyGILState_STATE gstate;
		gstate = PyGILState_Ensure();

		PyObject* pFunc = NULL;
		PyObject* pModule = NULL;
		PyObject* pDict = NULL;
		PyObject* pClass = NULL;
		PyObject * pArgs = NULL;
		PyObject * pReturn = NULL;
		pModule = PyImport_ImportModule("dev.python.InterOpLookupTable");
		pDict = PyModule_GetDict(pModule);
		pClass = PyDict_GetItemString(pDict, "InterOpLookupTable");
		pFunc = PyObject_GetAttrString(pClass, "on_timer_handler");
		tls_timer_function.timer_function = pFunc;
		PyGILState_Release(gstate);
	}
	return tls_timer_function.timer_function;
}

// client register rpc callback
static void rpc_response_handler(dsn_error_t err, dsn_message_t rpc_request, dsn_message_t rpc_response, void* param)
{
	// acquire Python's Global Interpreter Lock (GIL) before calling any Python API functions
	PyGILState_STATE gstate;
	gstate = PyGILState_Ensure();

	PyObject* pFunc = tls_get_rpc_response_function();
	PyObject * pArgs = NULL;
	PyObject * pReturn = NULL;

	void* ptr;
	size_t size;
	char buffer[1000];
	dsn_msg_read_next(rpc_response, &ptr, &size);
	memcpy_s(buffer, size, ptr, size);
	dsn_msg_read_commit(rpc_response, size);

	pArgs = PyTuple_New(2);
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("s", buffer));
	PyTuple_SetItem(pArgs, 1, Py_BuildValue("i", (int)param));
	pReturn = PyEval_CallObject(pFunc, pArgs);

	PyGILState_Release(gstate);
	return;
}

// dsn_rpc_create_response_task(dsn_message_t request, dsn_rpc_response_handler_t cb, IntPtr param, int reply_hash);
dsn_task_t dsn_rpc_create_response_task_helper(dsn_message_t msg, int param, int reply_hash)
{
	return dsn_rpc_create_response_task(msg, rpc_response_handler, (void *)param, reply_hash);
}

// dsn_rpc_call(ref dsn_address_t server, dsn_task_t rpc_call, dsn_task_tracker_t tracker);
void dsn_rpc_call_helper(dsn_address_t1* addr, dsn_task_t rpc_call, dsn_task_tracker_t tracker)
{
	// dsn_rpc_call start
	dsn_address_t* addr_c = new dsn_address_t();
	addr_c->type = HOST_TYPE_IPV4; // addr->type = 0
	addr_c->ip = addr->ip;
	addr_c->port = addr->port;
	// dsn_rpc_call end
	dsn_rpc_call(addr_c, rpc_call, nullptr); // set tracker null
}

void* dsn_rpc_call_wait_helper(dsn_address_t1* addr, dsn_message_t msg, char *ss)
{
	// dsn_rpc_call_wait_helper start
	dsn_address_t* addr_c = new dsn_address_t();
	addr_c->type = HOST_TYPE_IPV4; // addr->type = 0
	addr_c->ip = addr->ip;
	addr_c->port = addr->port;
	// dsn_rpc_call end
	dsn_message_t resp = dsn_rpc_call_wait(addr_c, msg);
	
	void* ptr;
	size_t size;
	dsn_msg_read_next(resp, &ptr, &size);
	memcpy_s(ss, size, ptr, size);
	dsn_msg_read_commit(resp, size);

	return (void*)ss;
}

void marshall_helper(dsn_message_t msg, char* request_content)
{
	void* ptr;
	size_t size;
	size_t count = strlen(request_content)+1;
	dsn_msg_write_next(msg, &ptr, &size, count);
	memcpy_s(ptr, size, request_content, count);
	dsn_msg_write_commit(msg, count);
}

void marshall_int_msg_helper(int msg_int, char* request_content)
{
	dsn_message_t msg = (dsn_message_t)msg_int;
	
	void* ptr;
	size_t size;
	size_t count = strlen(request_content)+1;
	dsn_msg_write_next(msg, &ptr, &size, count);
	memcpy_s(ptr, size, request_content, count);
	dsn_msg_write_commit(msg, count);
}

static __thread struct __tls_rpc_request_function__
{
	int magic;
	PyObject *rpc_request_function;
} tls_rpc_request_function;

PyObject* tls_get_rpc_request_function()
{
	if (tls_rpc_request_function.magic != 0xdeadbeef)
	{
		// initialization goes here
		tls_rpc_request_function.magic = 0xdeadbeef;
		PyGILState_STATE gstate;
		gstate = PyGILState_Ensure();

		PyObject* pFunc = NULL;
		PyObject* pModule = NULL;
		PyObject* pDict = NULL;
		PyObject* pClass = NULL;
		PyObject * pArgs = NULL;
		PyObject * pReturn = NULL;
		pModule = PyImport_ImportModule("dev.python.InterOpLookupTable");
		pDict = PyModule_GetDict(pModule);
		pClass = PyDict_GetItemString(pDict, "InterOpLookupTable");
		pFunc = PyObject_GetAttrString(pClass, "on_request_handler");
		tls_rpc_request_function.rpc_request_function = pFunc;
		PyGILState_Release(gstate);
	}
	return tls_rpc_request_function.rpc_request_function;
}

// server register handler
static void rpc_request_handler(dsn_message_t rpc_request, void* param)
{
	// rpc request handler start
	// acquire Python's Global Interpreter Lock (GIL) before calling any Python API functions
	PyGILState_STATE gstate;
	gstate = PyGILState_Ensure();

	PyObject* pFunc = tls_get_rpc_request_function();
	PyObject * pArgs = NULL;
	PyObject * pReturn = NULL;

	void* ptr;
	size_t size;
	char buffer[1000]; // parse rpc request
	dsn_msg_read_next(rpc_request, &ptr, &size);
	memcpy_s(buffer, size, ptr, size);
	dsn_msg_read_commit(rpc_request, size);

	dsn_message_t rpc_response = dsn_msg_create_response(rpc_request);

	pArgs = PyTuple_New(3);
	PyTuple_SetItem(pArgs, 0, Py_BuildValue("s", buffer));
	PyTuple_SetItem(pArgs, 1, Py_BuildValue("i", (int)rpc_response));
	PyTuple_SetItem(pArgs, 2, Py_BuildValue("i", (int)param));
	pReturn = PyEval_CallObject(pFunc, pArgs);

	// rpc request handler end
	PyGILState_Release(gstate);
	
	return;
}

// bool dsn_rpc_register_handler(dsn_task_code_t code, const char* name, dsn_rpc_request_handler_t cb, void* param)
bool dsn_rpc_register_handler_helper(dsn_task_code_t code, const char* name, int param)
{
	return dsn_rpc_register_handler(code, name, rpc_request_handler, (void *)param);
}

int main(int argc, _TCHAR* argv[])
{
	return 0;
}

