__author__ = 'v-lshen'

app_dict = dict()
object_dict = dict()
function_dict = dict()


class InterOpLookupTable:
    @staticmethod
    def on_request_handler(rpc_request, rpc_response, callback_id):
        callback = function_dict[callback_id]
        callback(rpc_request, rpc_response)

    @staticmethod
    def on_timer_handler(rpc_response, callback_id):
        callback = function_dict[callback_id]
        callback(rpc_response)

    @staticmethod
    def task_handler(idx):
        idx_func = function_dict[idx]
        idx_func()

    @staticmethod
    def dict_release():
        app_dict.clear()
        object_dict.clear()
        function_dict.clear()
