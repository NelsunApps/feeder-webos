var ArticlesAssistant = Class.create(BaseAssistant, {
  initialize: function($super, subscription) {
    $super()
    this.subscription = subscription
    this.subscription.reset()
  },
  
  setup: function($super) {
    $super()
    
    var listAttributes = {
      itemTemplate: "articles/article",
      dividerTemplate: "articles/divider",
  		dividerFunction: this.divide,
  		onItemRendered: this.itemRendered
    }
    
    this.controller.setupWidget("articles", listAttributes, this.subscription)
    this.controller.listen("articles", Mojo.Event.listTap, this.articleTapped = this.articleTapped.bind(this))
    this.controller.listen("mark-all-read", Mojo.Event.tap, this.markAllRead = this.markAllRead.bind(this))
  },
  
  ready: function($super) {
    $super()
    this.controller.get("header").update(this.subscription.title)
    this.findArticles()
    
    if(this.subscription.markAllRead) {
      this.controller.get("mark-all-read").show()
    }
  },
  
  activate: function($super) {
    $super()
    this.refreshList(this.controller.get("articles"), this.subscription.items)
  },
  
  cleanup: function($super) {
    $super()
    this.controller.listen("articles", Mojo.Event.listTap, this.articleTapped)
  },

  findArticles: function() {
    this.smallSpinnerOn()
    this.subscription.findArticles(this.foundArticles.bind(this), this.bail.bind(this))
  },
      
  foundArticles: function() {
    this.refreshList(this.controller.get("articles"), this.subscription.items)
    this.smallSpinnerOff()
  },
    
  articleTapped: function(event) {
    if(event.item.load_more) {
      this.findArticles()
    }
    else {
      this.controller.stageController.pushScene("article", event.item)
    }
  },
  
  divide: function(article) {
    return article.sortDate
  },
  
  itemRendered: function(listWidget, itemModel, itemNode) {
    if(!itemModel.isRead) {
      $(itemNode).addClassName("unread")
    }
  },
  
  markAllRead: function(event) {
    this.smallSpinnerOn()    
    var count = this.subscription.getUnreadCount()
    
    this.subscription.markAllRead(function() {
      this.smallSpinnerOff()
      this.refreshList(this.controller.get("articles"), this.subscription.items)
      Mojo.Event.send(document, "MassMarkAsRead", {count: count})
    }.bind(this))
  }
})