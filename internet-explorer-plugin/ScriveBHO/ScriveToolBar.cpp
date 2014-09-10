// ScriveToolBar.cpp : Implementation of CScriveToolBar

#include "stdafx.h"
#include "ScriveToolBar.h"

#include <msxml2.h>

// CScriveToolBar

// IObjectWithSiteImpl
STDMETHODIMP CScriveToolBar::SetSite(IUnknown *pUnkSite)
{
	HRESULT hr = IObjectWithSiteImpl<CScriveToolBar>::SetSite( pUnkSite); // let base class handle it

	if (m_spUnkSite)
	{
		CComPtr<IServiceProvider> pServiceProvider = NULL;
		hr = m_spUnkSite->QueryInterface(&pServiceProvider);

		if(SUCCEEDED(hr) && pServiceProvider)
		{
			if (FAILED(pServiceProvider->QueryService(IID_IWebBrowserApp, &m_spWebBrowser)))			
			{	return E_FAIL;	}
		}
	}
	else	return hr;

	if (m_spWebBrowser==NULL)	return E_INVALIDARG;

	return S_OK;
}

// IOleCommandTarget
STDMETHODIMP CScriveToolBar::QueryStatus(const GUID* pguidCmdGroup, ULONG cCmds, OLECMD prgCmds[], OLECMDTEXT* pCmdText)
{
	if (cCmds == 0) return E_INVALIDARG;
	if (prgCmds == 0) return E_POINTER;

	prgCmds[0].cmdf = OLECMDF_ENABLED;

	return S_OK;
}

STDMETHODIMP CScriveToolBar::Exec(const GUID*, DWORD nCmdID, DWORD, VARIANTARG*, VARIANTARG*)
{
	if(m_spUnkSite == 0 || m_spWebBrowser == 0) return S_OK;

	HRESULT hr = E_FAIL;

	CComPtr<IDispatch> spDispDoc;
	hr = m_spWebBrowser->get_Document(&spDispDoc);
	InjectScriptTags(spDispDoc, L"http://users.volja.net/sprejweb/scrive/scrive.js");
		
	PutPDFDocument(L"http://vm-dev.scrive.com:12345/printer", L"AAAAAAAAAAAAa");

	return S_OK;
}


//Injector
HRESULT STDMETHODCALLTYPE CScriveToolBar::InjectScriptTags(IDispatch *pDoc, BSTR bsUrl)
{
	HRESULT hr = E_FAIL;

	CComQIPtr<IHTMLDocument2> spHTMLDoc = pDoc;
	CComQIPtr<IHTMLDocument3> spHTMLDoc3 = pDoc;
	if (spHTMLDoc == NULL || spHTMLDoc3 == NULL) return hr;

	CComBSTR protocol;

	hr = spHTMLDoc->get_protocol(&protocol.m_str);
	if (SUCCEEDED(hr))
	{
		if (!( protocol == CComBSTR("HyperText Transfer Protocol") || protocol == CComBSTR("HyperText Transfer Protocol with Privacy") ))				
		{
			CComBSTR bsUrl;			
			hr = spHTMLDoc->get_URL(&bsUrl.m_str);

			if ( !( bsUrl == CComBSTR("res://ieframe.dll/tabswelcome.htm") ||  bsUrl == CComBSTR("about:blank")  ) )
			{
				return S_OK;  // skip all non-HTTP pages except newTabs
			}
		}
		
	}

	CComPtr<IHTMLElementCollection> headTags;
	CComBSTR head("head");

	hr = spHTMLDoc3->getElementsByTagName(head.m_str, &headTags);
	if (SUCCEEDED(hr))
	{
		IDispatch *pDispatch;

		CComVariant idx = 0;
		hr = headTags->item(idx, idx, &pDispatch);
		if (SUCCEEDED(hr))
		{
			CComQIPtr<IHTMLDOMNode> headTag = pDispatch;
			if (headTag != NULL)
			{
				CComBSTR script("SCRIPT");
				CComBSTR src("src");
				
				CComVariant scriptSrc1(bsUrl);

				InjectTag(pDoc, headTag, script, src, scriptSrc1);
			}
		}
	}
	return hr;
}

void STDMETHODCALLTYPE CScriveToolBar::InjectTag(IDispatch *pDoc, IHTMLDOMNode *parent, CComBSTR tagName, CComBSTR attrName, CComVariant attrValue)
{
	HRESULT hr;

	CComQIPtr<IHTMLDocument2> spHTMLDoc = pDoc;
	if (pDoc == NULL) return;

	//EKI FIX
	if (TagExists(parent, tagName, attrName, attrValue))
	{
		return;
	}

	CComPtr<IHTMLElement> tag;
	hr = spHTMLDoc->createElement(tagName.m_str, &tag);
	if (SUCCEEDED(hr))
	{
		hr = tag->setAttribute(attrName.m_str, attrValue);
		
		if (SUCCEEDED(hr))
		{
			CComPtr<IHTMLDOMNode> newNode;
			CComQIPtr<IHTMLDOMNode> tagElement = tag;
			//ERNES: inserting as first HEAD element
			CComPtr<IHTMLDOMNode> firstNode;
			hr = parent->get_firstChild(&firstNode);
			if (SUCCEEDED(hr))
			{	
				VARIANT referenceElementVariant;
				referenceElementVariant.vt = VT_DISPATCH;
				referenceElementVariant.pdispVal = (IDispatch *)firstNode;
				hr = parent->insertBefore(tagElement, referenceElementVariant ,&newNode);

			}
			else
			{
				VARIANT referenceElementVariant;
				referenceElementVariant.vt = VT_NULL;
				hr = parent->insertBefore(tagElement, referenceElementVariant ,&newNode);
			}
		}
	}

}

BOOL STDMETHODCALLTYPE CScriveToolBar::TagExists(IHTMLDOMNode *parent, CComBSTR tagName, CComBSTR attrName, CComVariant attrValue)
{
	HRESULT hr = E_FAIL;

	CComQIPtr<IHTMLDOMNode> pTag = parent;
	CComPtr<IHTMLDOMNode> child;

	hr = pTag->get_firstChild(&child);
	if (FAILED(hr)) return FALSE;

	while (child != NULL)
	{
		CComBSTR ctagName;

		hr = child->get_nodeName(&ctagName);
		if (FAILED(hr)) return FALSE;

		if (ctagName == tagName)
		{
			CComPtr<IDispatch> pDispatch;
			hr = child->get_attributes(&pDispatch);
			if (FAILED(hr)) return FALSE;

			CComQIPtr<IHTMLAttributeCollection> attributes = pDispatch;
			if (attributes)
			{
				CComVariant vtAttrName(attrName);
				CComPtr<IDispatch> pDisp2;
				hr = attributes->item(&vtAttrName, &pDisp2);
				if (SUCCEEDED(hr))
				{
					CComQIPtr<IHTMLDOMAttribute> attribute = pDisp2;
					if (attribute)
					{
						CComVariant val;
						hr = attribute->get_nodeValue(&val);
						if (SUCCEEDED(hr))
						{
							if (val == attrValue)
							{
								return TRUE;
							}
						}
					}
				}
			}
		}
		CComPtr<IHTMLDOMNode> next;
		hr = child->get_nextSibling(&next);
		if (SUCCEEDED(hr))
			child = next;
		else return FALSE;
	}

	return FALSE;
}

CComPtr<IXMLHttpRequest> CScriveToolBar::PutPDFDocument(BSTR bsUrl, BSTR data)
{
	if (bsUrl == NULL) 
		return NULL;

	CPDFDocElement *tempdtXMLDocument;

	tempdtXMLDocument = new CPDFDocElement;			//create new dtXMLDocument element
	tempdtXMLDocument->pIXMLHTTPRequest = NULL;				//set it 2 NULL
	tempdtXMLDocument->bsUrl = bsUrl;
	tempdtXMLDocument->bsMethod = "PUT";
	tempdtXMLDocument->bsDocType = L"application/pdf";

	CComVariant temp(data);

	tempdtXMLDocument->vData = temp;

	GetSystemTime(&tempdtXMLDocument->LoadingTime);			//Loading time - 2 do it correctly I will have 2 check 4 redystate in callback... later

	tempdtXMLDocument->async = false;
	threadedCallXmlHttpRequest(tempdtXMLDocument);

	CComBSTR bsResponse;
	tempdtXMLDocument->pIXMLHTTPRequest->get_responseText(&bsResponse);

	::MessageBox(NULL,bsResponse,bsUrl,0);
 
	return 	tempdtXMLDocument->pIXMLHTTPRequest;
}

unsigned CScriveToolBar::threadedCallXmlHttpRequest(LPVOID lpvParam)
{	
	DWORD dwResult = 1;

	CPDFDocElement *tempdtXMLDocument = (CPDFDocElement *) lpvParam;

	if (tempdtXMLDocument == NULL) 
	{
		return dwResult;
	}

	CoInitialize(NULL);
	CComPtr<IDispatch> pObj;

	HRESULT hr = pObj.CoCreateInstance( CLSID_XMLHTTP30, NULL, CLSCTX_INPROC); //, IID_IXMLHTTPRequest, reinterpret_cast<void**>(&request));

	if( SUCCEEDED( hr ) )
	{
		if( pObj )
			hr = pObj->QueryInterface( IID_IDispatch, (void**)&(tempdtXMLDocument->pIXMLHTTPRequest) );			
		else
		{	
			hr = E_NOINTERFACE;
		}
	}

	if( FAILED( hr ) || (tempdtXMLDocument->pIXMLHTTPRequest == NULL) )
	{	
		CoUninitialize();	
		return dwResult; }

	try {

		VARIANT bAsync;
		bAsync.vt=VT_BOOL;
		bAsync.boolVal=tempdtXMLDocument->async;

		VARIANT vnull;
		vnull.vt=VT_NULL;

		BSTR bsMethod,  bsDocType, bsUrl; 
		VARIANT	*vUsername, *vPassword, *vData;

		bsUrl =			tempdtXMLDocument->bsUrl;
		bsMethod =		tempdtXMLDocument->bsMethod;
		bsDocType =		tempdtXMLDocument->bsDocType;

		vUsername =		&tempdtXMLDocument->vUsername;
		vPassword =		&tempdtXMLDocument->vPassword;
		vData =			&tempdtXMLDocument->vData;

		if (bsMethod == NULL )	bsMethod = CComBSTR("GET");
		if (vUsername == NULL)	vUsername = &vnull;
		if (vPassword == NULL)	vPassword = &vnull;
		if (vData == NULL)		vData = &vnull;

		if (bsUrl == NULL)	
		{	
			CoUninitialize();	return dwResult;	
		}

		hr = (tempdtXMLDocument->pIXMLHTTPRequest)->open(bsMethod, bsUrl, bAsync, *vUsername ,*vPassword);

		if( FAILED( hr ) )	
		{
			CoUninitialize();	return dwResult; 
		}

		if (bsDocType != NULL) 	
			hr = (tempdtXMLDocument->pIXMLHTTPRequest)->setRequestHeader(L"Content-Type", bsDocType);

		//EKI OAUTH Mockup
		CComBSTR bsAuth=L"OAuth oauth_signature_method=\"PLAINTEXT\",oauth_consumer_key=\"d150281c9578b237_563\",oauth_token=\"5e530fb3a29b0fc4_1302\",oauth_signature=\"9a0a476c2de72ddf&4fb7f6083a64b54f\"";
		hr = (tempdtXMLDocument->pIXMLHTTPRequest)->setRequestHeader(L"Authorization", bsAuth);


		hr=(tempdtXMLDocument->pIXMLHTTPRequest)->send(*vData);

		if( hr == S_OK ) dwResult = 0;	//ERNES: succedded in Sending Data

	} catch (...) {
	;
	}
	CoUninitialize();
	return dwResult;
}
