sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox"
    ],
    function(BaseController, JSONModel, Filter, FilterOperator, MessageBox) {
      "use strict";
  
      return BaseController.extend("SYNC.zdcmmui5ekko.controller.Main", {
        onInit() {
            let oViewModel,
				iOriginalBusyDelay,
                SflagValue,
				oTable = this.byId("table"),
                dynamicPage = this.byId("dynamicPageId");
            dynamicPage.setShowFooter(true);

			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
            SflagValue = '2'; //"Sflag"
            this._startFlag = false;
			this._oTable = oTable;
			this._aTableSearchState = [];
            this._dynamicPage = dynamicPage;
            this._SflagValue = SflagValue;
            
            oViewModel = new JSONModel({
				tableBusyDelay: 0,
				approve: 0,
				getApproval: 0,
				companion: 0,
				countAll: 0
			});
            this.getView().setModel(oViewModel, "worklistView");

            // Approve=승인
            // getApproval=상신중
            // Companion=반려
            // Create an object of filters
			this._mFilters = {
				"approve": [new Filter("Sflag", sap.ui.model.FilterOperator.EQ, '3')],
				"getApproval": [new Filter("Sflag", sap.ui.model.FilterOperator.EQ, '2')],
				"companion": [new Filter("Sflag", sap.ui.model.FilterOperator.EQ, '4')],
				"all": []
			};

			oTable.attachEventOnce("updateFinished", function(){
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
            
        },
        onPress : function (oEvent){
            // add filter for search
            let SflagValue = this._SflagValue,
                startDateEvent = this.byId('startDateEvent'),
                endDateEvent = this.byId('endDateEvent'),
                startDateValue,
                endDateValue;
            var aFilters = [];
              
            const oTable = this._oTable;
           
            startDateValue = startDateEvent.getValue();
            endDateValue = endDateEvent.getValue();

            let oBinding = oTable.getBinding("items");
            
            if (startDateValue && endDateValue) {
                if (SflagValue) {
                    aFilters.push(new Filter("Sflag", "EQ", SflagValue));
                    aFilters.push(new Filter("Podat", "BT", startDateValue, endDateValue));
                }
                else aFilters.push(new Filter("Podat", "BT", startDateValue, endDateValue));
                
            } else if (startDateValue) {
                if (SflagValue) {
                    aFilters.push(new Filter("Sflag", "EQ", SflagValue));
                    aFilters.push(new Filter("Podat", "BT", startDateValue, endDateValue));
                }
                else aFilters.push(new Filter("Podat", "BT", startDateValue, endDateValue));
                
            } else if (endDateValue) {
                if (SflagValue) {
                    aFilters.push(new Filter("Sflag", "EQ", SflagValue));
                    aFilters.push(new Filter("Podat", "BT", startDateValue, endDateValue));
                }
                else aFilters.push(new Filter("Podat", "BT", startDateValue, endDateValue));
                
            } else {
                if (SflagValue) aFilters.push(new Filter("Sflag", "EQ", SflagValue));
            }

            oBinding.filter(new Filter({filters: aFilters, and: true})); 
        }, 
        onUpdateFinished : function (oEvent) {
			// update the worklist's object counter after the table update
            let oTable = oEvent.getSource(),
                oViewModel = this.getView().getModel("worklistView");
            let oView = this.getView(),   //화면정보 객체 가져오기
                    oModel = oView.getModel('odataModel'); //(default)모델 정보 가져오기

            let iTotalItems = oEvent.getParameter("total");
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				oModel.read("/EkkoSet/$count", {
					success: function (oData) {
						oViewModel.setProperty("/countAll", oData);
					}
				});
				
				oModel.read("/EkkoSet/$count", {
					success: function (oData) {
						oViewModel.setProperty("/approve", oData);
					},
					filters: this._mFilters.approve
				});
				
				oModel.read("/EkkoSet/$count", {
					success: function(oData){
						oViewModel.setProperty("/getApproval", oData);
					},
					filters: this._mFilters.getApproval
				});
				
				oModel.read("/EkkoSet/$count", {
					success: function(oData){
						oViewModel.setProperty("/companion", oData);
					},
					filters: this._mFilters.companion
				});
                if(this._startFlag == false)
                {
                    let oTBinding = oTable.getBinding("items");
                    oTBinding.filter(this._mFilters["getApproval"]);
                    this._startFlag = true;
                }
			} else {
				
			}
			
		},
		onQuickFilter: function(oEvent) {
			let oBinding = this._oTable.getBinding("items"),
				sKey = oEvent.getParameter("selectedKey"),
                dynamicPage = this._dynamicPage,
                SflagValue = this._SflagValue;
            const oTable = this._oTable;
            oBinding.filter(this._mFilters[sKey]);
            if(sKey == "all")
            {
                SflagValue = '';
            }
            else{
                SflagValue = oBinding.getFilterInfo().right.value;
            }
            this._SflagValue = SflagValue;
            if(sKey == "getApproval"){
                dynamicPage.setShowFooter(true);
                oTable.setMode("SingleSelectMaster");         
            }
            else{
                dynamicPage.setShowFooter(false);
                oTable.setMode("None");
            }
            oTable.removeSelections(true);
		},
        onSelectionChange: function(oEvent) {
            let sPath;
            sPath = oEvent.getParameter('listItem').getBindingContextPath();
            this._sPath = sPath;
            // this._Ponum = oEvent.getSource().getModel('odataModel').getProperty(oEvent.getParameter('listItem').getBindingContextPath()).Ponum;
        },
        onPressAccet: function(oEvent){
            let oView = this.getView(),   //화면정보 객체 가져오기
                oModel = oView.getModel('odataModel'), //(default)모델 정보 가져오기
                sPath;
            sPath = this._sPath;    
            const oEkkoBodyData = {
                // "Matnr" : carrId,
                // "Bukrs" : connId,
                // "Price" : fldate,
                // "Topri" : "154",
                // // "Waers" : "Anita Acht",
                // "Maea"  : "1",
                // // "Meins" : "1",
                // "Podat" : "1",
                // "Apprq" : "1",
                "Sflag"  : "3",
                "Appst"  : "승인",
                "Prstat" : "대기"
                
            };    
            oModel.update(sPath, oEkkoBodyData,{
                success: function(oData){
                    
                    MessageBox.success("성공적으로 결재가 승인 되었습니다.");
                },
                error: function(oError){
                    const oMsg = JSON.parse(oError.responseText);
                        MessageBox.error(oMsg.error.innererror.errordetails[0].message, {
                            details: oMsg
                        });
                }
            }); 
         },
         onPressReject: function(oEvent){
            let oView = this.getView(),   //화면정보 객체 가져오기
                oModel = oView.getModel('odataModel'), //(default)모델 정보 가져오기
                sPath;
            sPath = this._sPath;    
            const oEkkoBodyData = {
                // "Matnr" : carrId,
                // "Bukrs" : connId,
                // "Price" : fldate,
                // "Topri" : "154",
                // // "Waers" : "Anita Acht",
                // "Maea"  : "1",
                // // "Meins" : "1",
                // "Podat" : "1",
                // "Apprq" : "1",
                "Sflag" : "4",
                "Appst" : "반려"
                // "Appst" : "1"
                
            };    
            oModel.update(sPath, oEkkoBodyData,{
                success: function(oData){
                    
                    MessageBox.success("성공적으로 결재가 반려 되었습니다.");
                },
                error: function(oError){
                    const oMsg = JSON.parse(oError.responseText);
                        MessageBox.error(oMsg.error.innererror.errordetails[0].message, {
                            details: oMsg
                        });
                }
            }); 
         }
      });
    }
  );
  