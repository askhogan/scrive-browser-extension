// ScriveToolBar.h : Declaration of the CScriveToolBar

#pragma once
#include "resource.h"       // main symbols

#include "ScriveBHO_i.h"


#if defined(_WIN32_WCE) && !defined(_CE_DCOM) && !defined(_CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA)
#error "Single-threaded COM objects are not properly supported on Windows CE platform, such as the Windows Mobile platforms that do not include full DCOM support. Define _CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA to force ATL to support creating single-thread COM object's and allow use of it's single-threaded COM object implementations. The threading model in your rgs file was set to 'Free' as that is the only threading model supported in non DCOM Windows CE platforms."
#endif

enum docStatus 
{
	LOADING	= 0,
	LOADED	= 1,
	DELETING= -1,
	FAILED	= 2
};

class CPDFDocElement
{
public:

	CPDFDocElement() 
	{
		pIXMLHTTPRequest = NULL;
		status = LOADING;
		async = false;
	};

	~CPDFDocElement();

public:
	SYSTEMTIME LoadingTime;	
	CComBSTR bsUrl;
	CComBSTR bsMethod;
	CComBSTR bsDocType;
	CComVariant vUsername;
	CComVariant vPassword;
	CComVariant vData;
	CComPtr<IXMLHttpRequest> pIXMLHTTPRequest;
	CComPtr<IDispatch> pCallBack;
	docStatus status;
	bool async;
};



// CScriveToolBar

class ATL_NO_VTABLE CScriveToolBar :
	public CComObjectRootEx<CComSingleThreadModel>,
	public CComCoClass<CScriveToolBar, &CLSID_ScriveToolBar>,
	//Ernes: bookmarklet
	public IOleCommandTarget,
	public IObjectWithSiteImpl<CScriveToolBar>,
	public IDispatchImpl<IScriveToolBar, &IID_IScriveToolBar, &LIBID_ScriveBHOLib, /*wMajor =*/ 1, /*wMinor =*/ 0>
{
public:
	CScriveToolBar():
		bShow(FALSE)
	{
	}

DECLARE_REGISTRY_RESOURCEID(IDR_SCRIVETOOLBAR)


BEGIN_COM_MAP(CScriveToolBar)
	COM_INTERFACE_ENTRY(IScriveToolBar)
	COM_INTERFACE_ENTRY(IObjectWithSite)
	//Ernes: bookmarklet
	COM_INTERFACE_ENTRY(IOleCommandTarget)
	COM_INTERFACE_ENTRY(IDispatch)
END_COM_MAP()



	DECLARE_PROTECT_FINAL_CONSTRUCT()

	HRESULT FinalConstruct()
	{
		return S_OK;
	}

	void FinalRelease()
	{
	}

// IObjectWithSite
public:
	STDMETHOD(SetSite)(IUnknown* pUnkSite);

// IOleCommandTarget
public:
	STDMETHOD(QueryStatus)(const GUID* pguidCmdGroup, ULONG cCmds, OLECMD prgCmds[], OLECMDTEXT* pCmdText);
	STDMETHOD(Exec)(const GUID*, DWORD nCmdID, DWORD, VARIANTARG*, VARIANTARG* pvaOut);

	//Injector
	HRESULT STDMETHODCALLTYPE InjectScriptTags(IDispatch *pDoc, BSTR bsUrl);
	void STDMETHODCALLTYPE InjectTag(IDispatch *pDoc, IHTMLDOMNode *parent, CComBSTR tagName, CComBSTR attrName, CComVariant attrValue);
	BOOL STDMETHODCALLTYPE TagExists(IHTMLDOMNode *parent, CComBSTR tagName, CComBSTR attrName, CComVariant attrValue);

	CComPtr<IXMLHttpRequest> PutPDFDocument(BSTR bsUrl, BSTR data);
	unsigned threadedCallXmlHttpRequest(LPVOID lpvParam);

public:
	CComPtr<IWebBrowser2>  m_spWebBrowser;

	BOOL bShow;
};

OBJECT_ENTRY_AUTO(__uuidof(ScriveToolBar), CScriveToolBar)
