For those who don't know what Obsidian is, or just want to see what the plugin looks like without downloading it, I made a quick demo and posted it to youtube:
https://youtu.be/8XOno3ZlQ4I

This obsidian plugin introduces a new file explorer system essentially separate from the obsidian vault.

Essentially, it adds new "filetypes" (typescript classes stored in json files) that can be interpreted, displayed, and edited within the plugin view. These "filetypes" must be one of the classes implemented within the plugin. As the only developer thus far, these "filetypes" have been thought up and implemented on my whims, and as a result, they may seem very specific to my use cases.

Since I still plan to use this primarily for myself, any pull requests will have to be reviewed by me. However, feel free to make a fork and implement filetypes and UIs for your own use case.

File types so far:
# Folders
Should be self explanatory for anyone familiar with any kind of file explorer. Folders can store multiple folders and files within them, and the user can click files within them to navigate the file system (each file system built by the plugin is called a source folder).

# Single Media File
A wrapper around some form of image or video (audio recordings can be added with minimal effort). While the option does exist to change the file that is being represented, this does erase the previously represented file, so keep this in mind.

# Variant Media File
Used when two media files are essentially the same media, just variants (such as covers of songs), and you want to consolidate them into one reference. It picks one at random to display.

# Playlist
Stores an array of media files (single or variant). The UI has buttons to loop a single file, shuffle (just picks a random index without regard for repitition), and hide the video (but keep the sound).

# Story
On the starting page, define a list of people/characters and specify the language (so far I have english and my 2 WIP conlangs, see the conlang dictionary filetype below if you don't know what a conlang is)

Each page of the story can show a media file (optional), with lines of text on the right hand side.

Note: the two conlangs mentioned in the code require my custom fonts to display, which I will not be releasing.

# Source Folder Shortcut
A shortcut to another source folder.

# Conlang Dictionary
A conlang is a constructed language, as opposed to a natural language that exists/existed in the real world. In other words, the two conlangs used in the Story file type are ones that only I can speak, read, and write in.

The dictionary file type is helpful for storing and searching for terms and definitions, whether in a conlang or even in english.

Note: the two conlangs mentioned in the code require my custom fonts to display, which I will not be releasing.

# TBA
## File types
- Since files have unchanging file ids and can't be deleted, a shortcut file type will likely be useful so that multiple copies of a file can be placed in multiple folders.
## Features
- There is currently no way to move a file to another folder within the UI, though the code has been pretty close to implementation ever since the beginning. (I've never had to move anything, so it's never been fully implemented)
- Allow for redownloading of media files
