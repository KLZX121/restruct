"""
All in one productivity app
"""

import toga
from toga.style import Pack
from toga.style.pack import COLUMN, ROW


class Restruct(toga.App):
    def startup(self):
        
        #create notes section
        notes_label = toga.Label("Quick Notes", style = Pack(padding_bottom = 10))
        notes_text = toga.MultilineTextInput(placeholder = "Jot down some ideas...", style = Pack(width = 300, height = 300))

        notes_box = toga.Box(style = Pack(direction = COLUMN, padding = (10, 20)))
        notes_box.add(notes_label, notes_text)


        #setup main box
        main_box = toga.Box()
        main_box.add(toga.Divider(), notes_box)

        #set main window
        self.main_window = toga.MainWindow(content = main_box)

        #show window
        self.main_window.show()



def main():
    return Restruct()
