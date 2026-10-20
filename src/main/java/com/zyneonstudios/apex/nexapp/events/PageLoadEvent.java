package com.zyneonstudios.apex.nexapp.events;

public abstract class PageLoadEvent implements Event {

    String url;

    public PageLoadEvent() {
        this(null);
    }

    public PageLoadEvent(String url) {
        super();
        this.url = url;
    }

    /**
     * @param url Overrides the given url. Does not redirect the frame.
     */
    public final void url(String url) {
        this.url = url;
    }

    /**
     * @return The url of the frame if updated
     */
    public final String url() {
        return url;
    }
}
