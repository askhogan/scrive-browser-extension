// dllmain.h : Declaration of module class.

class CScriveBHOModule : public CAtlDllModuleT< CScriveBHOModule >
{
public :
	DECLARE_LIBID(LIBID_ScriveBHOLib)
	DECLARE_REGISTRY_APPID_RESOURCEID(IDR_SCRIVEBHO, "{D7DCEB7D-6DF4-4BB6-9F12-9F326FC52B93}")
};

extern class CScriveBHOModule _AtlModule;
