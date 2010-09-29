var MainAssistant = Class.create(BaseAssistant, {
  initialize: function($super, api) {
    $super()
    this.sources = new AllSources(api)
  },
  
  setup: function($super) {
    $super()
    
    var listAttributes = {
      itemTemplate: "main/source",
      dividerTemplate: "main/divider",
  		dividerFunction: this.divide,
  		onItemRendered: this.sourceRendered
    }
    
    this.controller.setupWidget("sources", listAttributes, this.sources)
    this.controller.listen("sources", Mojo.Event.listTap, this.sourceTapped = this.sourceTapped.bind(this))
    this.controller.listen("refresh", Mojo.Event.tap, this.refresh = this.refresh.bind(this))
    this.controller.listen(document, "ArticleRead", this.articleRead = this.articleRead.bind(this))
    this.controller.listen(document, "ArticleNotRead", this.articleNotRead = this.articleNotRead.bind(this))
    this.controller.listen(document, "MassMarkAsRead", this.massMarkAsRead = this.massMarkAsRead.bind(this))
  },
  
  cleanup: function($super) {
    $super()
    this.controller.stopListening("sources", Mojo.Event.listTap, this.sourceTapped)
    this.controller.stopListening("refresh", Mojo.Event.tap, this.refresh)
    this.controller.stopListening(document, "ArticleRead", this.articleRead)
    this.controller.stopListening(document, "ArticleNotRead", this.articleNotRead)
    this.controller.stopListening(document, "MassMarkAsRead", this.massMarkAsRead)
  },
  
  ready: function($super) {
    $super()
    this.refresh()
  },
  
  activate: function() {
    this.refreshList(this.controller.get("sources"), this.sources.items)
  },
  
  foundEm: function(feeds) {
    var sources = this.controller.get("sources")
    sources.mojo.noticeUpdatedItems(0, this.sources.items)
    sources.mojo.setLength(this.sources.items.length)
    this.smallSpinnerOff()
  },
  
  sourceTapped: function(event) {
    if(event.item.constructor == Folder) {
      this.controller.stageController.pushScene("folder", event.item)
    }
    else {
      this.controller.stageController.pushScene("articles", event.item)
    }
  },
  
  divide: function(source) {
    return source.divideBy
  },
  
  refresh: function() {
    this.smallSpinnerOn()
    this.sources.findAll(this.foundEm.bind(this), this.bail.bind(this))
  },
  
  articleRead: function(event) {
    this.sources.articleReadIn(event.subscriptionId)
  },
  
  articleNotRead: function(event) {
    this.sources.articleNotReadIn(event.subscriptionId)
  },
  
  massMarkAsRead: function(event) {
    this.sources.massMarkAsRead(event.count)
  }
})