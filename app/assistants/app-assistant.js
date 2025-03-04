var AppAssistant = Class.create({
  initialize: function() {
    this.mainStageName = "MainStage"
    this.dashboardStageName = "DashboardStage"
  },

  setup: function() {
    this.setInterval()
  },

  handleLaunch: function(parameters) {
    Log.debug("App Launched with " + Object.toJSON(parameters))
    var appController = Mojo.Controller.getAppController()
    var cardStageController = this.controller.getStageController(this.mainStageName)

    if (parameters) {
      
      if (parameters.sendDataToShare !== undefined) {
          
          //Touch2Share requested - request url to share from whatever scene is currently displayed.
          
          var ttsscene = cardStageController.topScene();
          var ttsurl;
          var ttsdata;
          
          if(!ttsscene){
              return;
          }
          //Query topmost scene for url
          if(ttsscene.assistant && ttsscene.assistant.getTouch2ShareURL){
              ttsurl = ttsscene.assistant.getTouch2ShareURL();
          }
          
          if(ttsurl){
             //url to share was returned from top scene - send to other device.
             ttsdata = { "target": ttsurl, "type": "rawdata", "mimetype": "text/html"};
              
              var ttsreq = new Mojo.Service.Request(
                  "palm://com.palm.stservice",
                  {
                      method: 'shareData', 
                      parameters: { 
                        data: ttsdata
                      },
                      onSuccess:function(payload){
                        //TouchToShare data sent to other device.
                      },
                      onFailure:function(payload){
                        //TouchToShare data failed to go to other device.
                        Mojo.Log.error("handleLaunch: TouchToShare operation failed: error: " + JSON.stringify(payload));
                      }
                  }
              )
          }
          return;
      }
      
      if(parameters.action == "update") {
        this.checkForUpdates()
      }

      this.setInterval(parameters.action == "notificationIntervalChange")
    }
    else {
      if (cardStageController) {
        cardStageController.activate()
      }
      else {
        this.controller.createStageWithCallback(
          {name: this.mainStageName, lightweight: true},
          function(stageController) {stageController.pushScene("login")},
          "card"
        )
      }
    }
  },

  checkForUpdates: function() {
    var self = this
    var api = new Api()

    api.login(new Credentials(), function() {
      api.getUnreadCounts(function(counts) {
        var unreadCount = 0

        $A(counts).each(function(count) {
          if(count.count && Preferences.wantsNotificationFor(count.id)) {
            unreadCount += count.count
          }
        })

        if(unreadCount) {
          self.sendNotification(unreadCount)
        }
      })
    })
  },

  sendNotification: function(unreadCount) {
    var appController = Mojo.Controller.getAppController()
    var dashboardStage = appController.getStageProxy(this.dashboardStageName)

    if(dashboardStage) {
      dashboardStage.delegateToSceneAssistant("updateDashboard", unreadCount)
    }
    else {
      appController.createStageWithCallback(
        {name: this.dashboardStageName, lightweight: true},
        function(stageController){stageController.pushScene("dashboard", unreadCount)},
        "dashboard"
      )
    }
  },

  setInterval: function(changed) {
    var self = this

    if (Preferences.notificationInterval() == "00:00:00" || changed) {
      new Mojo.Service.Request("palm://com.palm.power/timeout", {
        method: "clear",

        parameters: {
          "key": Mojo.appInfo.id + ".timer",
        }
      })
    }

    if (Preferences.notificationInterval() != "00:00:00") {
      self.wakeupRequest = new Mojo.Service.Request("palm://com.palm.power/timeout", {
        method: "set",
        parameters: {
          "key": Mojo.appInfo.id + ".timer",
          "in": Preferences.notificationInterval(),
          "wakeup": true,
          "uri": "palm://com.palm.applicationManager/open",
          "params": {
            "id": Mojo.appInfo.id,
            "params": {
              "action": "update"
            }
          }
        }
      })
    }
  }
})

