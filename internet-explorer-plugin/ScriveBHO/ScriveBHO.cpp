// ScriveBHO.cpp : Implementation of DLL Exports.

#include "stdafx.h"
#include "resource.h"
#include "ScriveBHO_i.h"
#include "dllmain.h"

#include <ShlGuid.h>

// Used to determine whether the DLL can be unloaded by OLE
STDAPI DllCanUnloadNow(void)
{
    return _AtlModule.DllCanUnloadNow();
}


// Returns a class factory to create an object of the requested type
STDAPI DllGetClassObject(REFCLSID rclsid, REFIID riid, LPVOID* ppv)
{
    return _AtlModule.DllGetClassObject(rclsid, riid, ppv);
}


//===============================================
//#clsid = CLSID of COM object
bool RegisterComCat(CLSID clsid, CATID CatID)
{
    ICatRegister  *pcr;
    HRESULT        hr = S_OK ;

    CoInitialize(NULL);

    hr = CoCreateInstance(CLSID_StdComponentCategoriesMgr, 
                          NULL, 
                          CLSCTX_INPROC_SERVER, 
                          IID_ICatRegister, 
                          (LPVOID*)&pcr);

    if(SUCCEEDED(hr))
    {
        hr = pcr->RegisterClassImplCategories(clsid, 1, &CatID);
        pcr->Release();
    }

    CoUninitialize();

    return SUCCEEDED(hr);
}

//===============================================
//#clsid = CLSID of COM object
bool UnRegisterComCat(CLSID clsid, CATID CatID)
{
    ICatRegister  *pcr;
    HRESULT        hr = S_OK ;

    CoInitialize(NULL);

    hr = CoCreateInstance(CLSID_StdComponentCategoriesMgr, 
                          NULL, 
                          CLSCTX_INPROC_SERVER, 
                          IID_ICatRegister, 
                          (LPVOID*)&pcr);

    if(SUCCEEDED(hr))
    {
		hr = pcr->UnRegisterClassImplCategories(clsid, 1, &CatID);
        pcr->Release();
    }

    CoUninitialize();

    return SUCCEEDED(hr);
}

// DllRegisterServer - Adds entries to the system registry
STDAPI DllRegisterServer(void)
{
    // registers object, typelib and all interfaces in typelib
    HRESULT hr = _AtlModule.DllRegisterServer();

	return hr;
}

// DllUnregisterServer - Removes entries from the system registry
STDAPI DllUnregisterServer(void)
{
	HRESULT hr = SELFREG_E_CLASS;

	hr = _AtlModule.DllUnregisterServer();

	return hr;
}
