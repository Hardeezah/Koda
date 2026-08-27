from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import date
from enum import Enum

class Incoterm(str, Enum):
    FOB = "FOB"
    CIF = "CIF"
    CFR = "CFR"
    EXW = "EXW"
    FCA = "FCA"
    DAP = "DAP"
    DDP = "DDP"

class PaymentTerm(str, Enum):
    LETTER_OF_CREDIT = "LETTER_OF_CREDIT"
    TELEGRAPHIC_TRANSFER = "TELEGRAPHIC_TRANSFER"
    BILLS_FOR_COLLECTION = "BILLS_FOR_COLLECTION"
    OPEN_ACCOUNT = "OPEN_ACCOUNT"

class PartyInfo(BaseModel):
    name: str = Field(..., description="Full legal name")
    address: str = Field(..., description="Registered address")
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    tin: Optional[str] = Field(None, description="Tax Identification Number")
    nepc_reg_no: Optional[str] = Field(None, description="NEPC Registration Number")
    country_code: Optional[str] = Field(None, description="Country Code (e.g., NG)")

class LineItem(BaseModel):
    description: str = Field(..., description="Clear, precise description")
    hs_code: str = Field(..., description="Harmonized System Code")
    quantity: float
    unit: str = Field(..., description="Unit of measure (e.g., MT, kg)")
    unit_price: float
    total_value: float
    country_of_origin: str = "Nigeria"
    net_weight_kg: float
    gross_weight_kg: float

class CommercialInvoice(BaseModel):
    invoice_number: str
    invoice_date: date
    purchase_order_number: Optional[str] = None
    payment_terms: PaymentTerm
    currency: str
    exporter: PartyInfo
    consignee: PartyInfo
    port_of_loading: str
    port_of_discharge: str
    incoterms: Incoterm
    line_items: List[LineItem]
    total_net_weight_kg: float
    total_gross_weight_kg: float
    total_invoice_value: float
    declaration: str = "We certify that this invoice is true and correct and that the goods are of Nigerian origin."

class PackageDetail(BaseModel):
    package_number: str
    packaging_type: str = Field(..., description="e.g., Bags, Cartons, Pallets")
    dimensions: Optional[str] = Field(None, description="L x W x H")
    content_description: str
    quantity: float
    net_weight_kg: float
    gross_weight_kg: float

class PackingList(BaseModel):
    packing_list_number: str
    packing_list_date: date
    related_invoice_number: str
    exporter: PartyInfo
    consignee: PartyInfo
    vessel_name: Optional[str] = None
    port_of_loading: str
    port_of_discharge: str
    packages: List[PackageDetail]
    total_packages: int
    total_net_weight_kg: float
    total_gross_weight_kg: float

class NXPFormRequest(BaseModel):
    tin: str
    nepc_reg_no: str
    authorized_dealer_bank: str
    consignee: PartyInfo
    commodity_description: str
    hs_code: str
    quantity: float
    unit: str
    net_weight_kg: float
    gross_weight_kg: float
    fob_value: float
    freight_charges: float = 0.0
    expected_shipment_date: date
    method_of_payment: PaymentTerm

class CertificateOfOrigin(BaseModel):
    exporter: PartyInfo
    consignee: PartyInfo
    transport_details: str
    item_number: str
    marks_and_numbers: str
    number_and_kind_of_packages: str
    description_of_goods: str
    hs_code: str
    gross_weight_kg: float
    invoice_number: str
    invoice_date: date

class PhytosanitaryCertificateRequest(BaseModel):
    exporter: PartyInfo
    consignee: PartyInfo
    botanical_name: str
    common_name: str
    quantity_declared: float
    number_and_description_of_packages: str
    distinguishing_marks: str
    place_of_origin: str = Field(..., description="State in Nigeria")
    declared_means_of_conveyance: str
    declared_point_of_entry: str

class SingleGoodsDeclaration(BaseModel):
    declarant: PartyInfo
    exporter: PartyInfo
    consignee: PartyInfo
    custom_office_of_export: str
    transport_mode: str
    port_of_loading: str
    port_of_discharge: str
    items: List[LineItem]
    total_fob_value: float
    total_net_weight_kg: float
    total_gross_weight_kg: float
    nxp_reference: str

class CleanCertificateOfInspection(BaseModel):
    cci_number: str
    date_of_issue: date
    inspection_agency: str
    exporter: PartyInfo
    consignee: PartyInfo
    nxp_reference: str
    port_of_loading: str
    port_of_discharge: str
    items: List[LineItem]
    total_fob_value: float
    ness_fee_paid: float
    verification_result: str = "Satisfactory"

class BillOfLading(BaseModel):
    bol_number: str
    date_of_issue: date
    shipper: PartyInfo
    consignee: PartyInfo
    notify_party: Optional[PartyInfo] = None
    carrier_name: str
    vessel_name: str
    port_of_loading: str
    port_of_discharge: str
    place_of_delivery: Optional[str] = None
    packages: List[PackageDetail]
    total_gross_weight_kg: float
    freight_status: str
    shipped_on_board_date: date
