"""Module de web scrapping"""

#%%

from itertools import product
from pprint import pprint
from requests_html import HTMLSession, AsyncHTMLSession
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pdf2image import convert_from_path


import sys

TYPE = "LICENCE"
CARRIERE = sys.argv[2] #Info-TREC7
PARCOURS = sys.argv[3] #Commun
SEMESTRE =  sys.argv[4] #4
SEMAINE = sys.argv[5] #30
ROOT = 'https://applis.univ-nc.nc'

poppler_path = "C:/Program Files (x86)/poppler-23.07.0/Library/bin"

output_folder = "./img/edt/"

#%%

import os

def get_link(link="https://applis.univ-nc.nc/cgi-bin/WebObjects/EdtWeb.woa", session=HTMLSession()):
    texte = session.get(link).html
    edt = texte.find("ul#mainMenu>li>a[title='EDT des formations']", first=True)
    return ROOT+edt.attrs["href"]

def get_licence(session=HTMLSession(), type=TYPE):
    link = get_link()
    texte = session.get(link).html
    edt = texte.find(f'a[title="{type}"]', first=True)
    return ROOT+edt.attrs["href"]

def get_carriere(session=HTMLSession(),type=TYPE, carriere=CARRIERE):
    link = get_licence(session, type)
    texte = session.get(link).html
    edt = texte.find(f'a:contains("{carriere}")', first=True)
    return ROOT+edt.attrs["href"]

def get_semestre(session=HTMLSession(),type=TYPE, carriere=CARRIERE, parcours = PARCOURS, semestre = SEMESTRE):
    link = get_carriere(session,type, carriere)
    if link == None: return None
    texte = session.get(link).html
    ul_element = texte.find('ul:has(font.menuItemSelected)>li', containing=f'{parcours}')[0]
    if ul_element == None:
        return None
    li_element = ul_element.find('div>a[title="voir le planning correspondant"]')
    for lien in li_element:
        if lien.text == semestre:
            return ROOT+lien.attrs["href"]
    return None

def get_edt(session=HTMLSession(),type=TYPE, carriere=CARRIERE, parcours = PARCOURS, semestre = SEMESTRE, semaine=SEMAINE):
    link = get_semestre(session, type, carriere,parcours,semestre)
    if link == None: return None
    texte = session.get(link).html
    edt = texte.find('tr#semaines>td>a', first = True, containing=str(semaine))
    return ROOT + edt.attrs["href"]

def get_pdf(session=HTMLSession(),type=TYPE, carriere=CARRIERE, parcours = PARCOURS, semestre = SEMESTRE, semaine=SEMAINE):
    link = get_edt(session, type, carriere, parcours, semestre, semaine)
    if link == None: return None
    texte = session.get(link).html
    edt = texte.find('iframe', first = True)
    if edt == None: return None
    return "https:"+edt.attrs["src"]

# ... (Previous code)
def pdf_to_image(pdf_file, output_folder, poppler_path):
    # Convert the PDF file to a list of PIL Image objects
    if pdf_file is None:
        return ""
    images = convert_from_path(pdf_file, poppler_path=poppler_path)
    paths = ""
    for i, image in enumerate(images):
        # Save each image as a file
        image_path = f"{output_folder}edt_{CARRIERE}_{SEMAINE}_{i}.png"
        image.save(image_path, "PNG")
        paths+=f"{image_path}\n"
    return paths






print(pdf_to_image(get_pdf(), output_folder, poppler_path))